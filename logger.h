#ifndef KEG_SCALE__LOGGER_H
#define KEG_SCALE__LOGGER_H

#include <ESPAsyncWebServer.h>
#include <umm_malloc/umm_heap_select.h>

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

  void handle() {
    this->logSocket.cleanupClients();
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

  void printWithFreeHeaps(const char* message) {
    uint32_t freeDramHeap;
    uint32_t freeIramHeap;
    {
      HeapSelectDram ephemeral;
      freeDramHeap = ESP.getFreeHeap();
    }
    {
      HeapSelectIram ephemeral;
      freeIramHeap = ESP.getFreeHeap();
    }
    this->printf("%s (free DRAM heap: %d, free IRAM heap: %d).\n", message, freeDramHeap, freeIramHeap);
  };
};

extern LoggerClass Logger;

#endif
