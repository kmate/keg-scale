#ifndef __WEBSERVER_H
#define __WEBSERVER_H

#include "ArduinoJson.h"
#include "AsyncJson.h"

#include <ESP8266mDNS.h>
#include <ESPAsyncWebServer.h>
#include <ESPDateTime.h>
#include <ESP8266WiFi.h>

const char compiledAt[] = __DATE__ " " __TIME__;

class OneParamRewrite : public AsyncWebRewrite {

protected:
  String _urlPrefix;
  int _paramIndex;
  String _paramsBackup;

public:
  OneParamRewrite(const char* from, const char* to) : AsyncWebRewrite(from, to) {
    _paramIndex = _from.indexOf('{');

    if( _paramIndex >=0 && _from.endsWith("}")) {
      _urlPrefix = _from.substring(0, _paramIndex);
      int index = _params.indexOf('{');
      if(index >= 0) {
        _params = _params.substring(0, index);
      }
    } else {
      _urlPrefix = _from;
    }
    _paramsBackup = _params;
  }

  bool match(AsyncWebServerRequest *request) override {
    if(request->url().startsWith(_urlPrefix)) {
      if(_paramIndex >= 0) {
        _params = _paramsBackup + request->url().substring(_paramIndex);
      } else {
        _params = _paramsBackup;
      }
      return true;
    } else {
      return false;
    }
  }
};

class WebServer {

  AsyncWebServer server;
  Config *config;

  void addRootHandler() {
    // TODO add cache based on LittleFS upload date if possible
    server.serveStatic("/", LittleFS, "/html/").setDefaultFile("index.html");
  }

  void addScalesHandler() {
    server.addRewrite(new OneParamRewrite("/scale/{scaleId}", "/scale?scaleId={scaleId}"));
    server.on("/scale", HTTP_GET, [this](AsyncWebServerRequest *request) {
      int scaleId = request->arg("scaleId").toInt();
      request->send(200, "text/plain", "TODO return status and data for scale #" + String(scaleId));
    });
    server.on("/scales", HTTP_GET, [this](AsyncWebServerRequest *request) {
      AsyncResponseStream *response = request->beginResponseStream("application/json");
      DynamicJsonDocument doc(64);
      doc["numScales"] = config->scales.size();
      serializeJson(doc, *response);
      request->send(response);
    });
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
    addScalesHandler();
    addStatusHandler();
    // makes local testing of web ui easier
    DefaultHeaders::Instance().addHeader("Access-Control-Allow-Origin", "*");
    // handle OPTIONS request of CORS pre-flight
    server.onNotFound([](AsyncWebServerRequest *request) {
      if (request->method() == HTTP_OPTIONS) {
        request->send(204);
      } else {
        request->send(404);
     }
    });
    server.begin();
  }
};

#endif
