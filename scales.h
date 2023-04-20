#ifndef KEG_SCALE__SCALES_H
#define KEG_SCALE__SCALES_H

#include <ArduinoJson.h>

#include "config.h"
#include "persistent_config.h"
#include "scale.h"

class Scales {

private:
  std::vector<Scale*> scales;

public:
  void begin(Config &config, PersistentConfig &persistentConfig) {
    for (int i = 0; i < config.scales.size(); ++i) {
      Scale *scale = new Scale(i, config.scales[i], persistentConfig.getCalibrationForScale(i));
      this->scales.push_back(scale);
      scale->begin();
    }
  }

  void handle() {
    for (Scale *scale : this->scales) {
      scale->update();
      yield();
    }
  }

  size_t size() {
    return this->scales.size();
  }

  void render(int index, JsonDocument &doc) {
    this->scales[index]->render(doc);
  }

  void standby(int index) {
    this->scales[index]->setState(new StandbyScaleState());
  }

  void liveMeasurement(int index) {
    this->scales[index]->setState(new LiveMeasurementScaleState());
  }

  void tare(int index) {
    this->scales[index]->setState(new TareScaleState());
  }

  void calibrate(int index, float knownMass) {
    this->scales[index]->setState(new CalibrateScaleState(knownMass));
  }
};

#endif
