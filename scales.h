#ifndef KEG_SCALE__SCALES_H
#define KEG_SCALE__SCALES_H

#include <ArduinoJson.h>
#include <ESPAsyncWebServer.h>

#include "config.h"
#include "persistent_config.h"
#include "scale.h"

class Scales {

private:
  std::vector<Scale*> scales;
  AsyncWebSocket socket;

public:
  Scales() : socket("/scales") {
    this->socket.onEvent([this](AsyncWebSocket *server, AsyncWebSocketClient *client, AwsEventType type, void *arg, uint8_t *data, size_t len) {
      if (type == WS_EVT_CONNECT) {
        for (int i = 0; i < this->scales.size(); ++i) {
          Scale *scale = this->scales[i];
          StaticJsonDocument<512> doc;
          doc["index"] = i;
          scale->render(doc);
          char data[512];
          size_t len = serializeJson(doc, data);
          client->text(data, len);
        }
      }
    });
  }

  AsyncWebSocket* getSocket() {
    return &this->socket;
  }

  void begin(Config &config, PersistentConfig &persistentConfig) {
    for (int i = 0; i < config.scales.size(); ++i) {
      Scale *scale = new Scale(i, config.scales[i], persistentConfig.getCalibrationForScale(i));
      this->scales.push_back(scale);
      scale->begin();
    }
  }

  void handle() {
    this->socket.cleanupClients();
    yield();
    for (int i = 0; i < this->scales.size(); ++i) {
      Scale *scale = this->scales[i];
      if (scale->update()) {
        StaticJsonDocument<512> doc;
        doc["index"] = i;
        scale->render(doc);
        char data[512];
        size_t len = serializeJson(doc, data);
        this->socket.textAll(data, len);
      }
      yield();
    }
  }

  size_t size() {
    return this->scales.size();
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
