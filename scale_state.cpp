#include "scale.h"
#include "scale_state.h"

void ScaleState::enter(Scale *_scale, ScaleState *prevState) {
  this->scale = _scale;
}

void OnlineScaleState::enter(Scale *scale, ScaleState *prevState) {
  ScaleState::enter(scale, prevState);
}

void OnlineScaleState::update() {
  this->scale->updateAdc();
  if (!this->scale->isAdcOnline()) {
    this->scale->setState(new OfflineScaleState());
  }
}

void OnlineScaleState::render(JsonObject &state) const {
  state["data"] = this->scale->getAdcData();
}

void StandbyScaleState::render(JsonObject &state) const {
  state["name"] = "standby";
  OnlineScaleState::render(state);
}

// power down scale on standby enter, power up on standby exit - if next state is not offline

void LiveMeasurementScaleState::render(JsonObject &state) const {
  state["name"] = "liveMeasurement";
  OnlineScaleState::render(state);
}

void TareScaleState::enter(Scale *scale, ScaleState *prevState) {
  OnlineScaleState::enter(scale, prevState);
  this->scale->startAdcTare();
}

void TareScaleState::update() {
  OnlineScaleState::update();
  if (this->scale->isAdcTareDone()) {
    this->scale->setState(new StandbyScaleState());
  }
}

void TareScaleState::render(JsonObject &state) const {
  state["name"] = "tare";
  OnlineScaleState::render(state);
}

void CalibrateScaleState::enter(Scale *scale, ScaleState *prevState) {
  OnlineScaleState::enter(scale, prevState);
  this->scale->calibrateAdc(this->knownMass);
}

void CalibrateScaleState::update() {
  OnlineScaleState::update();
  this->scale->setState(new StandbyScaleState());
}

void CalibrateScaleState::render(JsonObject &state) const {
  state["name"] = "calibrate";
  state["knownMass"] = this->knownMass;
  OnlineScaleState::render(state);
}

void OfflineScaleState::enter(Scale *scale, ScaleState *prevState) {
  ScaleState::enter(scale, prevState);
}

void OfflineScaleState::update() {
  this->scale->startAdc();
  this->scale->updateAdc();
  if (this->scale->isAdcOnline()) {
    // TODO continue recording if possible
    this->scale->setState(new StandbyScaleState());
  }
}

void OfflineScaleState::render(JsonObject &state) const {
  state["name"] = "offline";
}
