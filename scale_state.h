#ifndef KEG_SCALE__SCALE_STATE_H
#define KEG_SCALE__SCALE_STATE_H

#include <ArduinoJson.h>
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


class LiveMeasurementScaleState : public OnlineScaleState {

public:
  void render(JsonObject &state) const override;
};

class TapMeasurementScaleState : public OnlineScaleState {
};

class TareScaleState : public OnlineScaleState {

public:
  void enter(Scale *scale, ScaleState *prevState) override;
  void update() override;
  void exit(ScaleState *nextState) override {};

  void render(JsonObject &state) const override;
};

class CalibrateScaleState : public OnlineScaleState {

  float knownMass;

public:
  CalibrateScaleState(float _knownMass) : knownMass(_knownMass) {};
  void enter(Scale *scale, ScaleState *prevState) override;
  void update() override;
  void exit(ScaleState *nextState) override {};

  void render(JsonObject &state) const override;
};

class OfflineScaleState : public ScaleState {

public:
  void enter(Scale *scale, ScaleState *prevState) override;
  void update() override;
  void exit(ScaleState *nextState) override {};

  void render(JsonObject &state) const override;
};

#endif
