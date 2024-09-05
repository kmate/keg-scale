#ifndef KEG_SCALE__SCALES_H
#define KEG_SCALE__SCALES_H

#include <ArduinoJson.h>
#include <ESPAsyncWebServer.h>

#include "catalog.h"
#include "config.h"
#include "persistent_config.h"
#include "recorder.h"
#include "scale.h"

#define MAX_COMMAND_JSON_SIZE 512 // FIXME this will be too small for most realistic uploads - those can be as large as 16KB!
#define MAX_ERROR_JSON_SIZE   128

class Scales {

private:
  std::vector<Scale*> scales;
  AsyncWebSocket socket;

  AsyncWebSocketMessageBuffer *scaleToJson(Scale *scale, bool isFullRender) {
    MAKE_SCALE_JSON_DOC(doc);
    doc["type"] = "data";
    scale->render(doc, isFullRender);
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
    size_t index = command["index"];
    Scale *scale = this->scales[index];

    if (index < 0 || index >= this->scales.size()) {
      String message = "[Scales] Invalid scale index in command: " + String(index);
      Logger.print(message);
      client->text(this->errorToJson(message));
      return;
    }

    if (action == "standby") {
      scale->standby();
    } else if (action == "liveMeasurement") {
      scale->liveMeasurement();
    } else if (action == "tare") {
      scale->tare();
    } else if (action == "calibrate") {
      float knownMass = command["knownMass"];
      scale->calibrate(knownMass);
    } else if (action == "startRecording") {
      TapEntry *tapEntry = TapEntry::fromJson(command["tapEntry"].as<JsonObject>());
      scale->startRecording(tapEntry);
    } else if (action == "putRecordingEntry") {
      RecordingEntry *recordingEntry = RecordingEntry::fromJson(command["recordingEntry"].as<JsonObject>());
      scale->startRecording(recordingEntry);
    } else if (action == "pauseRecording") {
      scale->pauseRecording();
    } else if (action == "continueRecording") {
      scale->continueRecording();
    } else if (action == "stopRecording") {
      scale->stopRecording();
    } else {
      String message = "[Scales] Unknown scale command action: " + action;
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
          client->text(this->scaleToJson(scale, true));
        }
      } else if (type == WS_EVT_DATA) {
        AwsFrameInfo *info = (AwsFrameInfo *) arg;
        // FIXME for large uploads we'd need to support multi-frame messages?
        // it seems that up to 528 bytes the messages are single-frame
        if (info->final && info->index == 0 && info->len == len) {
          char *payload = (char *) data;
          payload[len] = 0;

          StaticJsonDocument<MAX_COMMAND_JSON_SIZE> doc;
          DeserializationError error = deserializeJson(doc, payload, len);
          if (error) {
            String message = "[Scales] Unable to deserialize scale command payload: " + String(payload);
            Logger.print(message);
            client->text(this->errorToJson(message));
            return;
          }

          JsonObject command = doc.as<JsonObject>();
          if (!this->isCommandValid(command)) {
            String message = "[Scales] Invalid scale command format: " + String(payload);
            Logger.print(message);
            client->text(this->errorToJson(message));
            return;
          }

          this->processCommand(command, client);
        } else {
          String message = "[Scales] Ignoring multi-frame scale command payload.";
          Logger.print(message);
          client->text(this->errorToJson(message));
        }
      }
    });
  }

  AsyncWebSocket* getSocket() {
    return &this->socket;
  }

  void begin(Config &config, PersistentConfig &persistentConfig, Recorder &recorder) {
    for (size_t i = 0; i < config.scales.size(); ++i) {
      Scale *scale = new Scale(i, config.scales[i], persistentConfig.getCalibrationForScale(i), recorder);
      this->scales.push_back(scale);
      scale->begin();
    }
  }

  void handle() {
    this->socket.cleanupClients();
    yield();
    for (Scale *scale : this->scales) {
      UpdateResult result = scale->update();
      if (result != UpdateResult::None) {
        bool isFullRender = result == UpdateResult::StateChange;
        this->socket.textAll(this->scaleToJson(scale, isFullRender));
      }
      yield();
    }
  }
};

#endif
