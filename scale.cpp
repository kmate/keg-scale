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

bool Scale::startRecorder(TapEntry *tapEntry) {
  return this->recorder.start(this->index, tapEntry, this->getAdcData());
}

bool Scale::putRecordingEntry(RecordingEntry *recordingEntry) {
  return this->recorder.putEntry(this->index, recordingEntry);
}

void Scale::pauseRecorder() {
  this->recorder.pause(this->index);
}

void Scale::stopRecorder() {
  this->recorder.stop(this->index);
}

bool Scale::updateRecorder() {
  return this->recorder.update(this->index, this->getAdcData());
}

void Scale::renderRecorder(JsonObject &obj, bool isFull) {
  this->recorder.render(this->index, obj, isFull);
}

void Scale::render(JsonDocument &doc, bool isFull) {
  doc["index"] = this->index;
  doc["isFull"] = isFull;

  JsonObject state = doc.createNestedObject("state");
  this->currentState->render(state, isFull);

#ifdef RENDER_SCALE_ADC_FOR_DEBUG
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
#endif
}


void Scale::standby() {
  Logger.printf("[Scale] Set scale %d to standby mode.\n", this->index);
  this->setState(new StandbyScaleState());
}

void Scale::liveMeasurement() {
  Logger.printf("[Scale] Start live measurement on scale %d.\n", this->index);
  this->setState(new LiveMeasurementScaleState());
}

void Scale::tare() {
  Logger.printf("[Scale] Start to tare scale %d.\n", this->index);
  this->setState(new TareScaleState());
}

void Scale::calibrate(float knownMass) {
  Logger.printf("[Scale] Calibrating scale %d to known mass of %.0fg.\n", this->index, knownMass);
  this->setState(new CalibrateScaleState(knownMass));
}

void Scale::startRecording(TapEntry *tapEntry) {
  Logger.printf("[Scale] Recording on scale %d for batch %s.\n", this->index, tapEntry->name);
  this->setState(new RecordingScaleState(tapEntry));
}

void Scale::startRecording(RecordingEntry *recordingEntry) {
  Logger.printf("[Scale] Recording on scale %d for batch %s.\n", this->index, recordingEntry->tapEntry.name);
  this->setState(new RecordingScaleState(recordingEntry));
}

void Scale::pauseRecording() {
  Logger.printf("[Scale] Pause recording on scale %d.\n", this->index);
  this->setState(new PausedRecordingScaleState());
}

void Scale::continueRecording() {
  Logger.printf("[Scale] Continue recording on scale %d.\n", this->index);
  this->setState(new RecordingScaleState());
}

void Scale::stopRecording() {
  Logger.printf("[Scale] Stop recording on scale %d.\n", this->index);
  this->setState(new StopRecordingScaleState());
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
      "[Scale] Scale %d went %s (signal timeout: %s, tare timeout: %s).\n",
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
