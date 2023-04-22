#ifndef KEG_SCALE__SCALES_H
#define KEG_SCALE__SCALES_H

#include <ArduinoJson.h>
#include <ESPAsyncWebServer.h>

#include "catalog.h"
#include "config.h"
#include "persistent_config.h"
#include "scale.h"

#define MAX_SCALE_JSON_SIZE   512
#define MAX_COMMAND_JSON_SIZE 512
#define MAX_ERROR_JSON_SIZE   128

class Scales {

private:
  std::vector<Scale*> scales;
  AsyncWebSocket socket;

  AsyncWebSocketMessageBuffer *scaleToJson(Scale *scale) {
    StaticJsonDocument<MAX_SCALE_JSON_SIZE> doc;
    doc["type"] = "data";
    scale->render(doc);
    size_t len = measureJson(doc);
    AsyncWebSocketMessageBuffer *buffer = this->socket.makeBuffer(len);
    serializeJson(doc, (char *) buffer->get(), len + 1);
    return buffer;
  }

  AsyncWebSocketMessageBuffer *errorToJson(String &message) {
    StaticJsonDocument<MAX_ERROR_JSON_SIZE> doc;
    doc["type"] = "error";
    doc["message"] = message;
    size_t len = measureJson(doc);
    AsyncWebSocketMessageBuffer *buffer = this->socket.makeBuffer(len);
    serializeJson(doc, (char *) buffer->get(), len + 1);
    return buffer;
  }

  bool isCommandValid(JsonObject &command) {
    return !command.isNull() && command.containsKey("action") && command.containsKey("index");
  }

  void processCommand(JsonObject &command, AsyncWebSocketClient *client) {
    String action = command["action"];
    int index = command["index"];

    if (action == "standby") {
      Logger.printf("Set scale %d to standby mode.\n", index);
      this->scales[index]->setState(new StandbyScaleState());
    } else if (action == "liveMeasurement") {
      Logger.printf("Start live measurement on scale %d.\n", index);
      this->scales[index]->setState(new LiveMeasurementScaleState());
    } else if (action == "tare") {
      Logger.printf("Start to tare scale %d.\n", index);
      this->scales[index]->setState(new TareScaleState());
    } else if (action == "calibrate") {
      float knownMass = command["knownMass"];
      Logger.printf("Calibrating scale %d to known mass of %.0fg.\n", index, knownMass);
      this->scales[index]->setState(new CalibrateScaleState(knownMass));
    } else if (action == "startRecording") {
      CatalogEntry *entry = CatalogEntry::fromJson(command["tapEntry"].as<JsonObject>());
      Logger.printf("Recording on scale %d for batch %s.\n", index, entry->name);

      // TODO implement recording based on tap entry
    } else {
      String message = "Unknown scale command action: " + action;
      Logger.print(message);
      client->text(this->errorToJson(message));
      return;
    }

    client->text("{\"type\":\"ack\"}");
  }

public:

  Scales() : socket("/scales") {
    this->socket.onEvent([this](AsyncWebSocket *server, AsyncWebSocketClient *client, AwsEventType type, void *arg, uint8_t *data, size_t len) {
      if (type == WS_EVT_CONNECT) {
        for (Scale *scale : this->scales) {
          client->text(this->scaleToJson(scale));
        }
      } else if (type == WS_EVT_DATA) {
        AwsFrameInfo *info = (AwsFrameInfo *) arg;
        // it seems that up to 528 bytes the messages are single-frame
        if (info->final && info->index == 0 && info->len == len) {
          char *payload = (char *) data;
          payload[len] = 0;

          StaticJsonDocument<MAX_COMMAND_JSON_SIZE> doc;
          DeserializationError error = deserializeJson(doc, payload, len);
          if (error) {
            String message = "Unable to deserialize scale command payload: " + String(payload);
            Logger.print(message);
            client->text(this->errorToJson(message));
            return;
          }

          JsonObject command = doc.as<JsonObject>();
          if (!this->isCommandValid(command)) {
            String message = "Invalid scale command format: " + String(payload);
            Logger.print(message);
            client->text(this->errorToJson(message));
            return;
          }

          this->processCommand(command, client);
        } else {
          String message = "Ignoring multi-frame scale command payload.";
          Logger.print(message);
          client->text(this->errorToJson(message));
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
};

#endif
