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
