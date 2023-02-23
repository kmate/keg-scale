#ifndef KEG_SCALE__LOGGER_H
#define KEG_SCALE__LOGGER_H

#include <ESPAsyncWebServer.h>

class LoggerClass : public Print {

private:
  AsyncWebSocket logSocket;

public:
  LoggerClass() : logSocket("/log") {
    this->logSocket.onEvent([this](AsyncWebSocket *server, AsyncWebSocketClient *client, AwsEventType type, void *arg, uint8_t *data, size_t len) {
      if (type == WS_EVT_CONNECT) {
        client->text("Logging started.");
      }
    });
  }

  void end() {
    this->logSocket.enable(false);
    this->logSocket.closeAll();
  }

  AsyncWebSocket* getSocket() {
    return &this->logSocket;
  }

  size_t write(uint8_t b) override {
    this->logSocket.binaryAll(&b, 1);
    return 1;
  }

  size_t write(const uint8_t *buffer, size_t len) override {
    this->logSocket.textAll((const char *) buffer, len);
    return len;
  }
};

extern LoggerClass Logger;

#endif
