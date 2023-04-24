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

  void pause(int index) {
    if (!this->hasRecording(index)) {
      Logger.printf("[Recorder] Unable to pause recording for scale %d.\n", index);
      return;
    }

    Logger.printf("[Recorder] Pause recording for scale %d.\n", index);
    this->entries[index]->isPaused = false;
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

    // TODO we might want to disallow setting a newer timestamp on a higher index. Should we save lastIndex and only allow to go below that?
    if (entry->rawData[value] == 0) {
      entry->rawData[value] = DateTime.now();
      return true;
    } else {
      return false;
    }
  }

  void render(int index, JsonObject &obj, bool isFull) {
    RecordingEntry *entry = this->entries[index];
    obj["isPaused"] = entry->isPaused;

    if (isFull) {
      obj["startDateTime"] = DateFormatter::format(DateFormatter::SIMPLE, entry->startDateTime);
      JsonObject tapEntry = obj.createNestedObject("tapEntry");
      entry->tapEntry.render(tapEntry);
    }

    time_t now = DateTime.now();
    JsonObject data = obj.createNestedObject("data");
    for (int i = 0; i < RECORDING_ENTRY_NUM_RAW_DATA_ITEMS; ++i) {
      time_t timestamp = entry->rawData[i];
      if (timestamp != 0 && (isFull || now - timestamp < MAX_PARTIAL_RENDER_TIME_DELAY_SECONDS)) {
        data[DateFormatter::format(DateFormatter::SIMPLE, timestamp)] = ((float) i) / MEASURED_POINTS_IN_LITERS;
      }
    }
  }
};

#endif
