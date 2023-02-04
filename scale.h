#ifndef KEG_SCALE__SCALE_H
#define KEG_SCALE__SCALE_H

#include "ArduinoJson.h"
#include <HX711_ADC.h>

#include "config.h"
#include "persistent_config.h"
#include "scale_state.h"

#define SCALE_SPS_THRESHOLD 5000
#define SCALE_SPS_RESAMPLE  10

class Scale {

private:
  ScaleConfig &config;
  ScaleCalibration *calibration;
  HX711_ADC adc;
  int spsResampled;
  ScaleState *currentState;
  ScaleState *nextState;

public:
  Scale(ScaleConfig &_config, ScaleCalibration *_calibration) : config(_config), calibration(_calibration), adc(_config.dataPin, _config.clockPin), spsResampled(0), currentState(nullptr), nextState(nullptr) {
    if (this->config.reverse) {
      this->adc.setReverseOutput();
    }
  }

  void begin();
  void update();
  void setState(ScaleState *newState);
  void render(DynamicJsonDocument &doc);

  void startAdc();
  uint8_t updateAdc();
  bool isAdcOnline();
  float getAdcData();

  void startAdcTare();
  bool isAdcTareDone();

  void calibrateAdc(float knownMass);
};

#endif
