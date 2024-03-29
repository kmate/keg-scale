#ifndef KEG_SCALE__SCALE_H
#define KEG_SCALE__SCALE_H

#include <ArduinoJson.h>
#include <HX711_ADC.h>

#include "config.h"
#include "persistent_config.h"
#include "recorder.h"
#include "scale_state.h"

// #define RENDER_SCALE_ADC_FOR_DEBUG

#ifdef RENDER_SCALE_ADC_FOR_DEBUG
  #define MAKE_SCALE_JSON_DOC(id) DynamicJsonDocument id(1536);
#else
  #define MAKE_SCALE_JSON_DOC(id) StaticJsonDocument<1024> id;
#endif

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
  void startRecording(TapEntry *tapEntry);
  void startRecording(RecordingEntry *recordingEntry);
  void pauseRecording();
  void continueRecording();
  void stopRecording();

  // functions used by different scale states
  void setState(ScaleState *newState);
  bool startRecorder(TapEntry *tapEntry = nullptr);
  bool putRecordingEntry(RecordingEntry *recordingEntry);
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
