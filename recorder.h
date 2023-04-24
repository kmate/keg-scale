#ifndef KEG_SCALE__RECORDER_H
#define KEG_SCALE__RECORDER_H

#include <cmath>
#include <ESPDateTime.h>

#include "catalog.h"
#include "logger.h"

#define RECORDING_ENTRY_NUM_RAW_DATA_ITEMS 200

#define GRAMS_IN_DECILITERS  100
#define DECILITERS_IN_LITERS 10

#define MAX_PARTIAL_RENDER_TIME_DELAY_SECONDS 10

struct RecordingEntry {
  CatalogEntry tapEntry;
  time_t startDateTime;
  bool isPaused;

  // This is a special encoding used to save RAM and persistent storage.
  // Each index represents the remaining volume in the keg in deciliters,
  // and each corresponding value tells when that volume was reached first.
  // A zero value is used to represent unused indices, i.e. unseens volumes.
  // For example, a non-zero value at index 117 tells when the keg had 11.7L
  // beer left in it. If the keg contained more in some point in time,
  // values on larger indices should contain earlier timestamps. Also,
  // if the keg currently contains 11.7L, lower indexes will contain zeroes.
  time_t rawData[RECORDING_ENTRY_NUM_RAW_DATA_ITEMS];
};

class Recorder {

private:
  RecordingEntry **entries;

public:
  bool load(int numScales) {
    this->entries = new RecordingEntry*[numScales];
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

  void start(int index, CatalogEntry *tapEntry) {
    if (this->hasRecording(index)) {
      Logger.printf("Continue recording for scale %d.\n", index);
      this->entries[index]->isPaused = false;
    } else {
      RecordingEntry *newEntry = new RecordingEntry;
      newEntry->tapEntry = *tapEntry;
      newEntry->startDateTime = DateTime.now();
      newEntry->isPaused = false;
      memset(newEntry->rawData, 0, sizeof(newEntry->rawData));
      this->entries[index] = newEntry;
    }
  }

  void pause(int index) {
    if (!this->hasRecording(index)) {
      Logger.printf("Unable to pause recording for scale %d.\n", index);
      return;
    }

    Logger.printf("Pause recording for scale %d.\n", index);
    this->entries[index]->isPaused = false;
  }

  void stop(int index) {
    if (!this->hasRecording(index)) {
      Logger.printf("Unable to stop recording for scale %d.\n", index);
      return;
    }

    RecordingEntry *entry = this->entries[index];
    this->entries[index] = nullptr;
    delete entry;
  }

  bool update(int index, float mass) {
    if (!this->hasRecording(index)) {
      Logger.printf("Unable to update recording entry for scale %d.\n", index);
      return false;
    }

    RecordingEntry *entry = this->entries[index];
    int value = round(mass * entry->tapEntry.finalGravity / GRAMS_IN_DECILITERS);
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
        data[DateFormatter::format(DateFormatter::SIMPLE, timestamp)] = ((float) i) / DECILITERS_IN_LITERS;
      }
    }
  }
};

#endif
