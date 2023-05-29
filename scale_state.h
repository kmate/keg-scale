#ifndef KEG_SCALE__SCALE_STATE_H
#define KEG_SCALE__SCALE_STATE_H

#include <ArduinoJson.h>
#include <ESPDateTime.h>

#include "recorder.h"

#define LIVE_MEASUREMENT_REFRESH_SECONDS 1

class Scale;

class ScaleState {

protected:
  Scale *scale;

public:
  virtual void enter(Scale *scale, ScaleState *prevState) = 0;
  virtual bool update() = 0;
  virtual void exit(ScaleState *nextState) = 0;

  virtual void render(JsonObject &state, bool isFull) const = 0;
};

class OnlineScaleState : public ScaleState {

public:
  void enter(Scale *scale, ScaleState *prevState) override;
  bool update() override;
  void exit(ScaleState *nextState) override {};

  void render(JsonObject &state, bool isFull) const override;
};

class StandbyScaleState : public OnlineScaleState {

public:
  void render(JsonObject &state, bool isFull) const override;
};


class LiveMeasurementScaleState : public OnlineScaleState {

private:
  time_t lastRefresh;

public:
  void enter(Scale *scale, ScaleState *prevState) override;
  bool update() override;

  void render(JsonObject &state, bool isFull) const override;
};

class RecordingScaleState : public OnlineScaleState {

  TapEntry *tapEntry;
  RecordingEntry *recordingEntry;

public:
  // constructor to start new recording
  RecordingScaleState(TapEntry *_tapEntry) : tapEntry(_tapEntry), recordingEntry(nullptr) {};

  // constructor to start recording from an exported entry
  RecordingScaleState(RecordingEntry *_recordingEntry) : tapEntry(nullptr), recordingEntry(_recordingEntry) {};

  // constructor to continue recording
  RecordingScaleState() : tapEntry(nullptr), recordingEntry(nullptr) {};

  void enter(Scale *scale, ScaleState *prevState) override;
  bool update() override;

  void render(JsonObject &state, bool isFull) const override;
};

class PausedRecordingScaleState : public RecordingScaleState {

public:
  void enter(Scale *scale, ScaleState *prevState) override;

  void render(JsonObject &state, bool isFull) const override;
};

class StopRecordingScaleState : public OnlineScaleState {

public:
  void enter(Scale *scale, ScaleState *prevState) override;
  bool update() override;

  void render(JsonObject &state, bool isFull) const override;
};

class TareScaleState : public OnlineScaleState {

public:
  void enter(Scale *scale, ScaleState *prevState) override;
  bool update() override;
  void exit(ScaleState *nextState) override {};

  void render(JsonObject &state, bool isFull) const override;
};

class CalibrateScaleState : public OnlineScaleState {

  float knownMass;

public:
  CalibrateScaleState(float _knownMass) : knownMass(_knownMass) {};
  void enter(Scale *scale, ScaleState *prevState) override;
  bool update() override;
  void exit(ScaleState *nextState) override {};

  void render(JsonObject &state, bool isFull) const override;
};

class OfflineScaleState : public ScaleState {

public:
  void enter(Scale *scale, ScaleState *prevState) override;
  bool update() override;
  void exit(ScaleState *nextState) override {};

  void render(JsonObject &state, bool isFull) const override;
};

#endif
