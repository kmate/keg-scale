#ifndef KEG_SCALE__SCALE_STATE_H
#define KEG_SCALE__SCALE_STATE_H

#include "ArduinoJson.h"
#include <HX711_ADC.h>

class Scale;

class ScaleState {

protected:
  Scale *scale;

public:
  virtual void enter(Scale *scale, ScaleState *prevState) = 0;
  virtual void update() = 0;
  virtual void exit(ScaleState *nextState) = 0;

  virtual void render(JsonObject &state) const = 0;
};

class OnlineScaleState : public ScaleState {

public:
  void enter(Scale *scale, ScaleState *prevState) override;
  void update() override;
  void exit(ScaleState *nextState) override {};

  void render(JsonObject &state) const override;
};

class StandbyScaleState : public OnlineScaleState {

public:
  void render(JsonObject &state) const override;
};

class RecordedScaleState : public OnlineScaleState {
};

class AdhocScaleState : public OnlineScaleState {
};

class TareScaleState : public OnlineScaleState {
};

class CalibrateScaleState : public OnlineScaleState {
};

class OfflineScaleState : public ScaleState {

public:
  void enter(Scale *scale, ScaleState *prevState) override;
  void update() override;
  void exit(ScaleState *nextState) override {};

  void render(JsonObject &state) const override;
};

#endif
