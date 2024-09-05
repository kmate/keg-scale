#include "scale.h"
#include "scale_state.h"

void ScaleState::enter(Scale *_scale, ScaleState *prevState) {
  this->scale = _scale;
}

void OnlineScaleState::enter(Scale *scale, ScaleState *prevState) {
  ScaleState::enter(scale, prevState);
}

bool OnlineScaleState::update() {
  this->scale->updateAdc();
  if (!this->scale->isAdcOnline()) {
    this->scale->setState(new OfflineScaleState());
  }
  return false;
}

void OnlineScaleState::render(JsonObject &state, bool isFull) const {
  state["data"] = this->scale->getAdcData();
}

void StandbyScaleState::render(JsonObject &state, bool isFull) const {
  OnlineScaleState::render(state, isFull);
  state["name"] = "standby";
}

void LiveMeasurementScaleState::enter(Scale *scale, ScaleState *prevState) {
  OnlineScaleState::enter(scale, prevState);
  this->lastRefresh = 0;
}

bool LiveMeasurementScaleState::update() {
  OnlineScaleState::update();

  time_t now = DateTime.now();
  time_t elapsed = now - this->lastRefresh;

  if (elapsed >= LIVE_MEASUREMENT_REFRESH_SECONDS) {
    this->lastRefresh = now;
    return true;
  }

  return false;
}

void LiveMeasurementScaleState::render(JsonObject &state, bool isFull) const {
  OnlineScaleState::render(state, isFull);
  state["name"] = "liveMeasurement";
}

void RecordingScaleState::enter(Scale *scale, ScaleState *prevState) {
  OnlineScaleState::enter(scale, prevState);
  if (this->recordingEntry != nullptr) {
    this->scale->putRecordingEntry(this->recordingEntry);
  } else {
    this->scale->startRecorder(this->tapEntry);
  }
}

bool RecordingScaleState::update() {
  OnlineScaleState::update();
  return this->scale->updateRecorder();
}

void RecordingScaleState::render(JsonObject &state, bool isFull) const {
  OnlineScaleState::render(state, isFull);
  state["name"] = "recording";
  state["isPaused"] = false;
  this->scale->renderRecorder(state, isFull);
}

void PausedRecordingScaleState::enter(Scale *scale, ScaleState *prevState) {
  OnlineScaleState::enter(scale, prevState);
  this->scale->pauseRecorder();
}

void PausedRecordingScaleState::render(JsonObject &state, bool isFull) const {
  RecordingScaleState::render(state, isFull);
  state["isPaused"] = true;
}

void StopRecordingScaleState::enter(Scale *scale, ScaleState *prevState) {
  OnlineScaleState::enter(scale, prevState);
  this->scale->stopRecorder();
}

bool StopRecordingScaleState::update() {
  this->scale->setState(new StandbyScaleState());
  // this might bring the scale offline, so let it be the effective change
  return OnlineScaleState::update();
}

void StopRecordingScaleState::render(JsonObject &state, bool isFull) const {
  OnlineScaleState::render(state, isFull);
  state["name"] = "recording";
}

void TareScaleState::enter(Scale *scale, ScaleState *prevState) {
  OnlineScaleState::enter(scale, prevState);
  this->scale->startAdcTare();
}

bool TareScaleState::update() {
  OnlineScaleState::update();
  if (this->scale->isAdcTareDone()) {
    this->scale->setState(new LiveMeasurementScaleState());
  }
  return false;
}

void TareScaleState::render(JsonObject &state, bool isFull) const {
  OnlineScaleState::render(state, isFull);
  state["name"] = "tare";
}

void CalibrateScaleState::enter(Scale *scale, ScaleState *prevState) {
  OnlineScaleState::enter(scale, prevState);
  this->scale->calibrateAdc(this->knownMass);
}

bool CalibrateScaleState::update() {
  OnlineScaleState::update();
  this->scale->setState(new LiveMeasurementScaleState());
  return false;
}

void CalibrateScaleState::render(JsonObject &state, bool isFull) const {
  OnlineScaleState::render(state, isFull);
  state["name"] = "calibrate";
  state["knownMass"] = this->knownMass;
}

void OfflineScaleState::enter(Scale *scale, ScaleState *prevState) {
  ScaleState::enter(scale, prevState);
}

bool OfflineScaleState::update() {
  this->scale->startAdc();
  this->scale->updateAdc();
  if (this->scale->isAdcOnline()) {
    if (this->scale->startRecorder()) {
      // continue recording if possible
      this->scale->setState(new RecordingScaleState());
    } else {
      this->scale->setState(new StandbyScaleState());
    }
  }
  return false;
}

void OfflineScaleState::render(JsonObject &state, bool isFull) const {
  state["name"] = "offline";
}
