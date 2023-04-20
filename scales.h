#ifndef KEG_SCALE__SCALES_H
#define KEG_SCALE__SCALES_H

#include <ArduinoJson.h>
#include <ESPAsyncWebServer.h>

#include "config.h"
#include "persistent_config.h"
#include "scale.h"

#define SCALE_JSON_DOCUMENT_SIZE 512

class Scales {

private:
  std::vector<Scale*> scales;
  AsyncWebSocket socket;

public:
  AsyncWebSocketMessageBuffer *scaleToJson(Scale *scale) {
    StaticJsonDocument<SCALE_JSON_DOCUMENT_SIZE> doc;
    scale->render(doc);
    size_t len = measureJson(doc);
    AsyncWebSocketMessageBuffer *buffer = this->socket.makeBuffer(len);
    serializeJson(doc, (char *) buffer->get(), len + 1);
    return buffer;
  }

  Scales() : socket("/scales") {
    this->socket.onEvent([this](AsyncWebSocket *server, AsyncWebSocketClient *client, AwsEventType type, void *arg, uint8_t *data, size_t len) {
      if (type == WS_EVT_CONNECT) {
        for (Scale *scale : this->scales) {
          client->text(this->scaleToJson(scale));
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
    for (Scale *scale : this->scales) {
      if (scale->update()) {
        this->socket.textAll(this->scaleToJson(scale));
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
