#ifndef KEG_SCALE__PERSISTENT_CONFIG_H
#define KEG_SCALE__PERSISTENT_CONFIG_H

#include <ESP_EEPROM.h>
#include <vector>

struct ScaleCalibration {
  long tareOffset;
  float calibrationFactor;
};

class PersistentConfig {

private:
  int numScales;
  ScaleCalibration *calibrationData;

public:

  void load(int numScales) {
    this->numScales = numScales;
    this->calibrationData = new ScaleCalibration[this->numScales];

    EEPROM.begin(this->numScales * sizeof(ScaleCalibration));
    bool hasData = EEPROM.percentUsed() >= 0;

    if (!hasData) {
      // destroy previously saved data when reconfigured
      EEPROM.commit();
    }

    int offset = 0;
    for (int i = 0; i < this->numScales; ++i) {
      ScaleCalibration *current = &this->calibrationData[i];
      if (hasData) {
        EEPROM.get(offset, current->tareOffset);
        offset += sizeof(current->tareOffset);
        EEPROM.get(offset, current->calibrationFactor);
        offset += sizeof(current->calibrationFactor);
      } else {
        current->tareOffset = 0;
        current->calibrationFactor = 1.0;
      }
    }
  }

  ScaleCalibration* getCalibrationForScale(int index) {
    return &this->calibrationData[index];
  }

  bool save() {
    int offset = 0;
    for (int i = 0; i < this->numScales; ++i) {
      ScaleCalibration *current = &this->calibrationData[i];
      EEPROM.put(offset, current->tareOffset);
      offset += sizeof(current->tareOffset);
      EEPROM.put(offset, current->calibrationFactor);
      offset += sizeof(current->calibrationFactor);
    }

    return EEPROM.commit();
  }
};

#endif
