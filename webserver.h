#ifndef __WEBSERVER_H
#define __WEBSERVER_H

#include "ArduinoJson.h"
#include "AsyncJson.h"

#include <ESP8266mDNS.h>
#include <ESPAsyncWebServer.h>
#include <ESPDateTime.h>
#include <ESP8266WiFi.h>

const char compiledAt[] = __DATE__ " " __TIME__;

class WebServer {

  AsyncWebServer server;
  Config *config;

  void addRootHandler() {
    // TODO add cache based on LittleFS upload date if possible
    server.serveStatic("/", LittleFS, "/html/").setDefaultFile("index.html");
  }

  void addStatusHandler() {
    server.on("/status", HTTP_GET, [this](AsyncWebServerRequest *request) {
      AsyncResponseStream *response = request->beginResponseStream("application/json");
      DynamicJsonDocument doc(1024);
      JsonObject general = doc.createNestedObject("general");
      general["compiledAt"] = compiledAt;
      general["currentTime"] = DateTime.toString();

      JsonObject wifi = doc.createNestedObject("wifi");
      wifi["ssid"] = config->wifi.ssid;
      wifi["ip"] = WiFi.localIP();

      JsonObject esp  = doc.createNestedObject("esp");
      esp["chipId"] = ESP.getChipId();
      esp["flashChipId"] = ESP.getFlashChipId();
      esp["coreVersion"] = ESP.getCoreVersion();
      esp["sdkVersion"] = ESP.getSdkVersion();
      esp["cpuFreqMHz"] = ESP.getCpuFreqMHz();
      esp["sketchSize"] = ESP.getSketchSize();
      esp["freeSketchSpace"] = ESP.getFreeSketchSpace();
      esp["freeHeap"] = ESP.getFreeHeap();
      esp["heapFragmentation"] = ESP.getHeapFragmentation();

      serializeJson(doc, *response);
      request->send(response);
    });
  }

public:
  WebServer(Config &config): server(config.httpPort) {
    this->config = &config;
    MDNS.addService("http", "tcp", config.httpPort);
  }

  void begin() {
    addRootHandler();
    addStatusHandler();
    // makes local testing of web ui easier
    DefaultHeaders::Instance().addHeader("Access-Control-Allow-Origin", "*");
    server.begin();
  }
};

#endif
