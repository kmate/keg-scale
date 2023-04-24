#ifndef KEG_SCALE__SCALE_H
#define KEG_SCALE__SCALE_H

#include <ArduinoJson.h>
#include <HX711_ADC.h>

#include "catalog.h"
#include "config.h"
#include "persistent_config.h"
#include "recorder.h"
#include "scale_state.h"

enum class UpdateResult {
  StateChange,
  StateUpdate,
  None
};

class Scale {

private:
  int index;
  ScaleConfig &config;
  ScaleCalibration *calibration;
  Recorder &recorder;
  HX711_ADC adc;
  bool adcOnlineFlag;
  ScaleState *currentState;
  ScaleState *nextState;

public:
  Scale(int _index, ScaleConfig &_config, ScaleCalibration *_calibration, Recorder &_recorder)
    : index(_index)
    , config(_config)
    , calibration(_calibration)
    , recorder(_recorder)
    , adc(_config.dataPin, _config.clockPin)
    , currentState(nullptr)
    , nextState(nullptr) {
    if (this->config.reverse) {
      this->adc.setReverseOutput();
    }
  }

  // public interface
  void begin();
  UpdateResult update();
  void render(JsonDocument &doc, bool isFull);

  void standby();
  void liveMeasurement();
  void tare();
  void calibrate(float knownMass);
  void startRecording(CatalogEntry *tapEntry);
  void pauseRecording();
  void continueRecording();
  void stopRecording();

  // functions used by different scale states
  void setState(ScaleState *newState);
  void startRecorder(CatalogEntry *tapEntry = nullptr);
  void pauseRecorder();
  void stopRecorder();
  bool updateRecorder();
  void renderRecorder(JsonObject &obj, bool isFull);

  void startAdc();
  uint8_t updateAdc();
  bool isAdcOnline();
  float getAdcData();

  void startAdcTare();
  bool isAdcTareDone();

  void calibrateAdc(float knownMass);
};

#endif
