#ifndef KEG_SCALE__WEBSERVER_H
#define KEG_SCALE__WEBSERVER_H

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
  Config &config;
  std::vector<Scale*> &scales;

  void addRootHandler() {
    // TODO add cache based on LittleFS upload date if possible
    this->server.serveStatic("/", LittleFS, "/html/").setDefaultFile("index.html");
  }

  void addConfigHandler() {
    this->server.on("/config", HTTP_GET, [this](AsyncWebServerRequest *request) {
      AsyncResponseStream *response = request->beginResponseStream("application/json");
      DynamicJsonDocument doc(2048);

      JsonArray jsc = doc.createNestedArray("scales");
      for (ScaleConfig sc : this->config.scales) {
        JsonObject obj = jsc.createNestedObject();
        sc.render(obj);
      }

      JsonArray jw = doc.createNestedArray("weights");
      for (Weight weight : this->config.weights) {
        JsonObject obj = jw.createNestedObject();
        weight.render(obj);
      }

      serializeJson(doc, *response);
      request->send(response);
    });
  }

  void addScaleHandlers() {
    this->server.addRewrite(new OneParamRewrite("/scale/{scaleId}", "/scale?scaleId={scaleId}"));
    this->server.on("/scale", HTTP_GET, [this](AsyncWebServerRequest *request) {
      int scaleId = request->arg("scaleId").toInt();
      if (scaleId >= 0 && scaleId < this->scales.size()) {
        AsyncResponseStream *response = request->beginResponseStream("application/json");
        DynamicJsonDocument doc(512);
        this->scales[scaleId]->render(doc);
        serializeJson(doc, *response);
        request->send(response);
      } else {
        request->send(400);
      }
    });

    this->server.addRewrite(new OneParamRewrite("/standby/{scaleId}", "/standby?scaleId={scaleId}"));
    this->server.on("/standby", HTTP_POST, [this](AsyncWebServerRequest *request) {
      int scaleId = request->arg("scaleId").toInt();
      if (scaleId >= 0 && scaleId < this->scales.size()) {
        this->scales[scaleId]->setState(new StandbyScaleState());
        request->send(200, "text/plain", "standby scale " + String(scaleId));
      } else {
        request->send(400);
      }
    });

    this->server.addRewrite(new OneParamRewrite("/live/{scaleId}", "/live?scaleId={scaleId}"));
    this->server.on("/live", HTTP_POST, [this](AsyncWebServerRequest *request) {
      int scaleId = request->arg("scaleId").toInt();
      if (scaleId >= 0 && scaleId < this->scales.size()) {
        this->scales[scaleId]->setState(new LiveMeasurementScaleState());
        request->send(200, "text/plain", "start live measurement on scale " + String(scaleId));
      } else {
        request->send(400);
      }
    });

    this->server.addRewrite(new OneParamRewrite("/tare/{scaleId}", "/tare?scaleId={scaleId}"));
    this->server.on("/tare", HTTP_POST, [this](AsyncWebServerRequest *request) {
      int scaleId = request->arg("scaleId").toInt();
      if (scaleId >= 0 && scaleId < this->scales.size()) {
        this->scales[scaleId]->setState(new TareScaleState());
        request->send(200, "text/plain", "tare scale " + String(scaleId));
      } else {
        request->send(400);
      }
    });

    this->server.addRewrite(new OneParamRewrite("/calibrate/{scaleId}", "/calibrate?scaleId={scaleId}"));
    this->server.on("/calibrate", HTTP_POST, [this](AsyncWebServerRequest *request) {
      int scaleId = request->arg("scaleId").toInt();
      if (scaleId >= 0 && scaleId < this->scales.size() && request->hasParam("knownMass")) {
        float knownMass = request->getParam("knownMass")->value().toFloat();
        this->scales[scaleId]->setState(new CalibrateScaleState(knownMass));
        request->send(200, "text/plain", "calibrate scale " + String(scaleId) + " with known mass " + String(knownMass) + "g");
      } else {
        request->send(400);
      }
    });
  }

  void addStatusHandler() {
    this->server.on("/status", HTTP_GET, [this](AsyncWebServerRequest *request) {
      AsyncResponseStream *response = request->beginResponseStream("application/json");
      DynamicJsonDocument doc(1024);
      JsonObject general = doc.createNestedObject("general");
      general["compiledAt"] = compiledAt;
      general["currentTime"] = DateTime.toString();
      general["bootTime"] = DateFormatter::format(DateFormatter::SIMPLE, DateTime.getBootTime());

      JsonObject wifi = doc.createNestedObject("wifi");
      wifi["ssid"] = this->config.wifi.ssid;
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
  WebServer(Config &_config, std::vector<Scale*> &_scales): config(_config), scales(_scales), server(_config.httpPort) {
    MDNS.addService("http", "tcp", this->config.httpPort);
  }

  void begin() {
    this->addRootHandler();
    this->addConfigHandler();
    this->addScaleHandlers();
    this->addStatusHandler();
    // makes local testing of web ui easier
    DefaultHeaders::Instance().addHeader("Access-Control-Allow-Origin", "*");
    // handle OPTIONS request of CORS pre-flight
    this->server.onNotFound([](AsyncWebServerRequest *request) {
      if (request->method() == HTTP_OPTIONS) {
        request->send(204);
      } else {
        request->send(404);
     }
    });
    this->server.begin();
  }
};

#endif
