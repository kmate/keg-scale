#ifndef KEG_SCALE__SCALE_H
#define KEG_SCALE__SCALE_H

#include <ArduinoJson.h>
#include <HX711_ADC.h>

#include "catalog.h"
#include "config.h"
#include "persistent_config.h"
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
  HX711_ADC adc;
  bool adcOnlineFlag;
  ScaleState *currentState;
  ScaleState *nextState;

public:
  Scale(int _index, ScaleConfig &_config, ScaleCalibration *_calibration) : index(_index), config(_config), calibration(_calibration), adc(_config.dataPin, _config.clockPin), currentState(nullptr), nextState(nullptr) {
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
  void startRecording(CatalogEntry *entry);
  void pauseRecording();
  void continueRecording();

  // functions used by different scale states
  void setState(ScaleState *newState);

  void startAdc();
  uint8_t updateAdc();
  bool isAdcOnline();
  float getAdcData();

  void startAdcTare();
  bool isAdcTareDone();

  void calibrateAdc(float knownMass);
};

#endif
