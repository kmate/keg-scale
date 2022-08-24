#ifndef __WEBSERVER_H
#define __WEBSERVER_H

#include "AsyncJson.h"
#include "ArduinoJson.h"

#include <ESP8266mDNS.h>
#include <ESPAsyncWebServer.h>

class WebServer {

  AsyncWebServer server;
  Config *config;

public:
  WebServer(Config &config): server(config.httpPort) {
    this->config = &config;
    MDNS.addService("http", "tcp", config.httpPort);
  }

  void begin() {
    server.serveStatic("/", LittleFS, "/html/").setDefaultFile("index.html");
    server.on("/status", HTTP_GET, [this](AsyncWebServerRequest *request) {
      AsyncResponseStream *response = request->beginResponseStream("application/json");
      DynamicJsonDocument doc(1024);
      // TODO add all of config + more runtime properties from ESP
      doc["heap"] = ESP.getFreeHeap();
      doc["ssid"] = this->config->wifi.ssid;
      serializeJson(doc, *response);
      request->send(response);
    });
    server.begin();
  }
};

#endif
