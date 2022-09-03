#ifndef KEG_SCALE__SCALE_H
#define KEG_SCALE__SCALE_H

#include "ArduinoJson.h"
#include <HX711_ADC.h>

#include "config.h"
#include "scale_state.h"

class Scale {

private:
  ScaleConfig &config;
  HX711_ADC adc;
  ScaleState *currentState;
  ScaleState *nextState;

public:
  Scale(ScaleConfig &_config) : config(_config), adc(_config.dataPin, _config.clockPin), currentState(nullptr), nextState(nullptr) {
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
