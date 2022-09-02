#include "scale.h"

void Scale::begin() {
  this->adc.begin(this->config.gain);
  this->setState(new OfflineScaleState());
}

void Scale::update() {
  this->currentState->update();
}

void Scale::setState(ScaleState *newState) {
  if (this->currentState != nullptr) {
    this->currentState->exit(newState);
  }
  yield();
  ScaleState *prevState = this->currentState;
  this->currentState = newState;
  this->currentState->enter(this, prevState);
  // It is expected that we create new objects for newState each time,
  // hence we need to destroy the previous state here.
  if (prevState != nullptr) {
    delete prevState;
  }
  yield();
}

void Scale::render(DynamicJsonDocument &doc) {
  JsonObject state = doc.createNestedObject("state");
  this->currentState->render(state);

  JsonObject adc = doc.createNestedObject("adc");
  adc["clockPin"] = this->config.clockPin;
  adc["dataPin"] = this->config.dataPin;
  adc["gain"] = this->config.gain;
  adc["reverse"] = this->config.reverse;

  adc["tareOffset"] = this->adc.getTareOffset();
  adc["calibrationFactor"] = this->adc.getCalFactor();

  adc["samplesPerSecond"] = this->adc.getSPS();
  adc["conversionTime"] = this->adc.getConversionTime();

  adc["samplesInUse"] = this->adc.getSamplesInUse();
  adc["settlingTime"] = this->adc.getSettlingTime();
  adc["readIndex"] = this->adc.getReadIndex();
  adc["dataSetStatus"] = this->adc.getDataSetStatus();

  adc["tareTimeoutFlag"] = this->adc.getTareTimeoutFlag();
  adc["signalTimeoutFlag"] = this->adc.getSignalTimeoutFlag();
}

void Scale::startAdc() {
  // TODO should the timeout / tare flag come from config?
  this->adc.startMultiple(1000, false);
}

uint8_t Scale::updateAdc() {
  return this->adc.update();
}

bool Scale::isAdcOnline() {
  return !this->adc.getTareTimeoutFlag() && !this->adc.getSignalTimeoutFlag() && this->adc.getSPS() < 100;
}

float Scale::getAdcData() {
  return this->adc.getData();
}
