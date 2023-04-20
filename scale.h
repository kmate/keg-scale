#ifndef KEG_SCALE__SCALE_H
#define KEG_SCALE__SCALE_H

#include <ArduinoJson.h>
#include <HX711_ADC.h>

#include "config.h"
#include "persistent_config.h"
#include "scale_state.h"

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

  void begin();
  void update();
  void setState(ScaleState *newState);
  void render(JsonDocument &doc);

  void startAdc();
  uint8_t updateAdc();
  bool isAdcOnline();
  float getAdcData();

  void startAdcTare();
  bool isAdcTareDone();

  void calibrateAdc(float knownMass);
};

#endif
