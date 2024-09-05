#ifndef KEG_SCALE__RECORDER_H
#define KEG_SCALE__RECORDER_H

#include <cmath>
#include <ESPDateTime.h>
#include <vector>

#include "logger.h"

#define MEASURED_POINTS_IN_LITERS 20

#define MAX_MEASURED_LITERS 20

#define RECORDING_ENTRY_NUM_RAW_DATA_ITEMS (MEASURED_POINTS_IN_LITERS * MAX_MEASURED_LITERS)

#define MAX_PARTIAL_RENDER_TIME_DELAY_SECONDS 10

struct TapEntry {
  char id[32];
  uint8_t number;
  char name[128];
  time_t bottlingDate;
  float bottlingVolume;
  bool useBottlingVolume;
  float tareOffset;
  float finalGravity;
  float abv;
  float srm;

  void render(JsonObject &obj) {
    obj["id"] = this->id;
    obj["number"] = this->number;
    obj["name"] = this->name;
    obj["bottlingDate"] = DateFormatter::format(DateFormatter::DATE_ONLY, this->bottlingDate);
    obj["bottlingVolume"] = this->bottlingVolume;
    obj["useBottlingVolume"] = this->useBottlingVolume;
    obj["tareOffset"] = this->tareOffset;
    obj["finalGravity"] = this->finalGravity;
    obj["abv"] = this->abv;
    obj["srm"] = this->srm;
  }

  static TapEntry *fromJson(const JsonObject &obj) {
    TapEntry *entry = new TapEntry;
    strlcpy(entry->id, obj["id"] | "", sizeof(entry->id));
    entry->number = obj["number"] | 0;
    strlcpy(entry->name, obj["name"] | "", sizeof(entry->name));

    struct tm bottlingDateTm = {0};
    strptime(obj["bottlingDate"], "%Y-%m-%d", &bottlingDateTm);
    entry->bottlingDate = mktime(&bottlingDateTm);

    entry->bottlingVolume = obj["bottlingVolume"];
    entry->useBottlingVolume = obj["useBottlingVolume"];
    entry->tareOffset = obj["tareOffset"];
    entry->finalGravity = obj["finalGravity"];
    entry->abv = obj["abv"];
    entry->srm = obj["srm"];
    return entry;
  }
};

struct RecordingEntry {
  TapEntry tapEntry;
  time_t startDateTime;
  bool isPaused;

  // This is a special encoding used to save RAM and persistent storage.
  // Each index represents the remaining volume in the keg in "units",
  // and each corresponding value tells when that volume was reached first.
  // A zero value is used to represent unused indices, i.e. unseens volumes.
  // For example, a non-zero value at index 233 tells when the keg had 11.65L
  // beer left in it (assuming 20 units is 1L). If the keg contained more in
  // some point in time, values on larger indices should contain earlier timestamps.
  // Also, if the keg currently contains 11.7L, lower indexes will contain zeroes.
  time_t rawData[RECORDING_ENTRY_NUM_RAW_DATA_ITEMS];

  // Used to guard against increasing the available volume.
  // Each time we update the rawData field, we save the index here,
  // and we don't allow next time to fill larger indices than this.
  int latestValue;

  void render(JsonObject &obj, bool isFull = true) {
    obj["isPaused"] = this->isPaused;

    if (isFull) {
      obj["startDateTime"] = DateFormatter::format(DateFormatter::SIMPLE, this->startDateTime);
      JsonObject tapEntry = obj.createNestedObject("tapEntry");
      this->tapEntry.render(tapEntry);
    }

    time_t now = DateTime.now();
    JsonObject data = obj.createNestedObject("data");
    for (int i = 0; i < RECORDING_ENTRY_NUM_RAW_DATA_ITEMS; ++i) {
      time_t timestamp = this->rawData[i];
      if (timestamp != 0 && (isFull || now - timestamp < MAX_PARTIAL_RENDER_TIME_DELAY_SECONDS)) {
        data[String(timestamp)] = ((float) i) / MEASURED_POINTS_IN_LITERS;
      }
    }
  }

  static RecordingEntry *fromJson(const JsonObject &obj) {
    RecordingEntry *entry = new RecordingEntry;

    TapEntry *tapEntry = TapEntry::fromJson(obj["tapEntry"]);
    memcpy(&entry->tapEntry, tapEntry, sizeof(entry->tapEntry));
    delete tapEntry;

    struct tm startDateTimeTm = {0};
    strptime(obj["startDateTime"], "%Y-%m-%d %H:%M:%S", &startDateTimeTm);
    entry->startDateTime = mktime(&startDateTimeTm);

    entry->isPaused = obj["isPaused"] | true;

    memset(entry->rawData, 0, sizeof(entry->rawData));
    JsonObject data = obj["data"].as<JsonObject>();
    for (JsonPair kv : data) {
      int index = (int) round(kv.value().as<float>() * MEASURED_POINTS_IN_LITERS);
      time_t timestamp = (time_t) atoi(kv.key().c_str());
      entry->rawData[index] = timestamp;
    }

    entry->latestValue = RECORDING_ENTRY_NUM_RAW_DATA_ITEMS;
    return entry;
  }
};

class Recorder {

private:
  std::vector<RecordingEntry*> entries;

public:
  bool load(int numScales) {
    for (int i = 0; i < numScales; ++i) {
      this->entries.push_back(nullptr);
    }
    // TODO read recording data from persistent storage
    return true;
  }

  // TODO write recording data to persistent storage
  bool save() {
    return true;
  }

  bool hasRecording(int index) {
    return this->entries[index] != nullptr;
  }

  bool start(int index, TapEntry *tapEntry, float currentMass) {
    if (this->hasRecording(index)) {
      Logger.printf("[Recorder] Continue recording for scale %d.\n", index);
      this->entries[index]->isPaused = false;
      return true;
    } else if (tapEntry != nullptr) {
      Logger.printf("[Recorder] Start recording for scale %d (%s).\n", index, tapEntry->name);

      RecordingEntry *newEntry = new RecordingEntry;
      memcpy(&newEntry->tapEntry, tapEntry, sizeof(newEntry->tapEntry));
      delete tapEntry;

      newEntry->startDateTime = DateTime.now();
      newEntry->isPaused = false;
      memset(newEntry->rawData, 0, sizeof(newEntry->rawData));
      newEntry->latestValue = RECORDING_ENTRY_NUM_RAW_DATA_ITEMS;

      if (newEntry->tapEntry.useBottlingVolume) {
        newEntry->tapEntry.tareOffset = currentMass - (newEntry->tapEntry.bottlingVolume * newEntry->tapEntry.finalGravity);
      }

      this->entries[index] = newEntry;
      return true;
    } else {
      Logger.printf("[Recorder] Unable to start or continue recording for scale %d.\n", index);
      return false;
    }
  }

  bool putEntry(int index, RecordingEntry *recordingEntry) {
    if (this->hasRecording(index)) {
      Logger.printf("[Recorder] Unable to upload new recording data for scale %d.\n", index);
      return false;
    } else {
      Logger.printf("[Recorder] Continue recording from upload for scale %d (%s).\n", index, recordingEntry->tapEntry.name);
      this->entries[index] = recordingEntry;
      return true;
    }
  }

  void pause(int index) {
    if (!this->hasRecording(index)) {
      Logger.printf("[Recorder] Unable to pause recording for scale %d.\n", index);
      return;
    }

    Logger.printf("[Recorder] Pause recording for scale %d.\n", index);
    this->entries[index]->isPaused = true;
  }

  void stop(int index) {
    if (!this->hasRecording(index)) {
      Logger.printf("[Recorder] Unable to stop recording for scale %d.\n", index);
      return;
    }

    Logger.printf("[Recorder] Stop recording for scale %d.\n", index);
    RecordingEntry *entry = this->entries[index];
    this->entries[index] = nullptr;
    delete entry;
  }

  bool update(int index, float mass) {
    if (!this->hasRecording(index)) {
      Logger.printf("[Recorder] Unable to update recording entry for scale %d.\n", index);
      return false;
    }

    RecordingEntry *entry = this->entries[index];
    if (entry->isPaused) {
      return false;
    }

    int value = round((mass - entry->tapEntry.tareOffset) / entry->tapEntry.finalGravity * MEASURED_POINTS_IN_LITERS);
    if (value < 0 || value >= RECORDING_ENTRY_NUM_RAW_DATA_ITEMS) {
      // do not record invalid volume values
      return false;
    }

    if (entry->tapEntry.useBottlingVolume && value > entry->tapEntry.bottlingVolume * MEASURED_POINTS_IN_LITERS) {
      // when using bottling volume, do not allow to exceed it, even when there's extra weight on top
      return false;
    }

    if (value >= entry->latestValue) {
      // do not allow increasing the available volume in any case
      return false;
    }

    if (entry->rawData[value] == 0) {
      entry->latestValue = value;
      entry->rawData[value] = DateTime.now();
      return true;
    } else {
      return false;
    }
  }

  void render(int index, JsonObject &obj, bool isFull) {
    RecordingEntry *entry = this->entries[index];
    entry->render(obj, isFull);
  }
};

#endif
