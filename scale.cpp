#include "scale.h"
#include "logger.h"

#define btoa(x) ((x)?"true":"false")

void Scale::begin() {
  this->adc.begin(this->config.gain);
  this->setState(new OfflineScaleState());
}

UpdateResult Scale::update() {
  if (this->nextState != nullptr) {
    if (this->currentState != nullptr) {
      this->currentState->exit(this->nextState);
    }
    yield();
    ScaleState *prevState = this->currentState;
    this->currentState = this->nextState;
    this->nextState = nullptr;
    this->currentState->enter(this, prevState);
    // It is expected that we create new objects for nextState each time,
    // hence we need to destroy the previous state here.
    if (prevState != nullptr) {
      delete prevState;
    }
    yield();
    return UpdateResult::StateChange;
  } else {
    return this->currentState->update()
      ? UpdateResult::StateUpdate
      : UpdateResult::None;
  }
}

void Scale::setState(ScaleState *newState) {
  // the actual state change is done on update()
  this->nextState = newState;
}

void Scale::render(JsonDocument &doc, bool isFull) {
  doc["index"] = this->index;

  JsonObject state = doc.createNestedObject("state");
  this->currentState->render(state, isFull);

  JsonObject adc = doc.createNestedObject("adc");
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
  this->adc.startMultiple(5000, false);
  this->adc.setTareOffset(this->calibration->tareOffset);
  this->adc.setCalFactor(this->calibration->calibrationFactor);
}

uint8_t Scale::updateAdc() {
  uint8_t updateResult = this->adc.update();

  bool isSignalTimeout = this->adc.getSignalTimeoutFlag();
  bool isTareTimeout = this->adc.getTareTimeoutFlag();
  bool newOnlineFlag = !isSignalTimeout && !isTareTimeout;

  if (newOnlineFlag != this->adcOnlineFlag) {
    Logger.printf(
      "Scale %d went %s (signal timeout: %s, tare timeout: %s).\n",
      this->index,
      newOnlineFlag ? "online" : "offline",
      btoa(isSignalTimeout),
      btoa(isTareTimeout)
    );
    this->adcOnlineFlag = newOnlineFlag;
  }

  return updateResult;
}

bool Scale::isAdcOnline() {
  return this->adcOnlineFlag;
}

float Scale::getAdcData() {
  return this->adc.getData();
}

void Scale::startAdcTare() {
  this->adc.tareNoDelay();
}

bool Scale::isAdcTareDone() {
  bool isDone = this->adc.getTareStatus();

  if (isDone) {
    this->calibration->tareOffset = this->adc.getTareOffset();
  }

  return isDone;
}

void Scale::calibrateAdc(float knownMass) {
  float newCalibrationFactor = this->adc.getNewCalibration(knownMass);
  this->calibration->calibrationFactor = newCalibrationFactor;
}
