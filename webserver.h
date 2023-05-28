#ifndef KEG_SCALE__WEBSERVER_H
#define KEG_SCALE__WEBSERVER_H

#include <ArduinoJson.h>
#include <AsyncJson.h>
#include <ESP8266mDNS.h>
#include <ESPAsyncWebServer.h>
#include <ESPDateTime.h>
#include <ESP8266WiFi.h>
#include <ESP_EEPROM.h>
#include <FS.h>
#include <LittleFS.h>
#include <umm_malloc/umm_heap_select.h>

const char compiledAt[] = __DATE__ " " __TIME__;

class WebServer {

  AsyncWebServer server;
  Config &config;
  PersistentConfig &persistentConfig;
  BrewfatherCatalog &catalog;
  Scales &scales;
  Recorder &recorder;

  void addRootHandler() {
    // TODO add cache based on LittleFS upload date if possible
    this->server.serveStatic("/", LittleFS, "/html/").setDefaultFile("index.html");
  }

  void addConfigHandler() {
    this->server.on("/config", HTTP_GET, [this](AsyncWebServerRequest *request) {
      AsyncResponseStream *response = request->beginResponseStream("application/json");
      DynamicJsonDocument doc(1536);

      JsonArray jsc = doc.createNestedArray("scales");
      for (ScaleConfig &sc : this->config.scales) {
        JsonObject obj = jsc.createNestedObject();
        sc.render(obj);
      }

      JsonArray jw = doc.createNestedArray("weights");
      for (Weight &weight : this->config.weights) {
        JsonObject obj = jw.createNestedObject();
        weight.render(obj);
      }

      serializeJson(doc, *response);
      request->send(response);
    });
  }

  void addPersistHandler() {
    this->server.on("/persist", HTTP_POST, [this](AsyncWebServerRequest *request) {
      if (this->persistentConfig.save()) {
        request->send(200, "text/plain", "ok");
      } else {
        request->send(500, "text/plain", "unable to persist configuration");
      }
    });
  }

  void addCatalogHandlers() {
    this->server.on("/catalog", HTTP_GET, [this](AsyncWebServerRequest *request) {
      AsyncResponseStream *response = request->beginResponseStream("application/json");
      DynamicJsonDocument doc(2048);
      doc["lastRefresh"] = DateFormatter::format(DateFormatter::SIMPLE, this->catalog.getLastRefresh());
      doc["lastStatusCode"] = this->catalog.getLastStatusCode();
      doc["lastErrorMessage"] = this->catalog.getLastErrorMessage();

      JsonArray entries = doc.createNestedArray("entries");
      for (CatalogEntry &entry : this->catalog.getEntries()) {
        JsonObject obj = entries.createNestedObject();
        entry.render(obj);
      }

      serializeJson(doc, *response);
      request->send(response);
    });
    this->server.on("/catalog/update", HTTP_POST, [this](AsyncWebServerRequest *request) {
      this->catalog.update();
      request->send(200, "text/plain", "ok");
    });
  }

  void addRecordingHandlers() {
    this->server.on("/recording/download", HTTP_GET, [this](AsyncWebServerRequest *request) {
      if (!request->hasParam("index")) {
        request->send(400, "text/plain", "no index provided");
      } else {
        int index = request->getParam("index")->value().toInt();
        AsyncResponseStream *response = request->beginResponseStream("application/json");
        StaticJsonDocument<1024> doc;
        JsonObject root = doc.to<JsonObject>();
        this->recorder.render(index, root, true);
        serializeJson(doc, *response);
        response->addHeader("Content-Disposition", String("attachment; filename=\"") + root["tapEntry"]["name"].as<String>() + ".keg.json\"");
        request->send(response);
      }
    });
    // TODO add upload handler
  }

  void addScalesHandler() {
    this->server.addHandler(this->scales.getSocket());
  }

  void addStatusHandler() {
    this->server.on("/status", HTTP_GET, [this](AsyncWebServerRequest *request) {
      AsyncResponseStream *response = request->beginResponseStream("application/json");
      DynamicJsonDocument doc(768);
      JsonObject general = doc.createNestedObject("general");
      general["compiledAt"] = compiledAt;
      general["currentTime"] = DateTime.toString();
      general["bootTime"] = DateFormatter::format(DateFormatter::SIMPLE, DateTime.getBootTime());

      JsonObject wifi = doc.createNestedObject("wifi");
      wifi["ssid"] = WiFi.SSID();
      wifi["ip"] = WiFi.localIP();

      JsonObject heap = doc.createNestedObject("heap");
      {
        HeapSelectDram ephemeral;
        heap["freeDramHeap"] = ESP.getFreeHeap();
        heap["dramHeapFragmentation"] = ESP.getHeapFragmentation();
      }
      {
        HeapSelectIram ephemeral;
        heap["freeIramHeap"] = ESP.getFreeHeap();
        heap["iramHeapFragmentation"] = ESP.getHeapFragmentation();
      }

      JsonObject eeprom = doc.createNestedObject("eeprom");
      eeprom["percentUsed"] = EEPROM.percentUsed();

      JsonObject fs = doc.createNestedObject("fs");
      FSInfo fsInfo;
      LittleFS.info(fsInfo);
      fs["totalBytes"] = fsInfo.totalBytes;
      fs["freeBytes"] = fsInfo.totalBytes - fsInfo.usedBytes;
      fs["blockSize"] = fsInfo.blockSize;
      fs["pageSize"] = fsInfo.pageSize;

      JsonObject esp = doc.createNestedObject("esp");
      esp["chipId"] = ESP.getChipId();
      esp["flashChipId"] = ESP.getFlashChipId();
      esp["coreVersion"] = ESP.getCoreVersion();
      esp["sdkVersion"] = ESP.getSdkVersion();
      esp["cpuFreqMHz"] = ESP.getCpuFreqMHz();
      esp["sketchSize"] = ESP.getSketchSize();
      esp["freeSketchSpace"] = ESP.getFreeSketchSpace();
      serializeJson(doc, *response);
      request->send(response);
    });
  }

  void addLogHandler() {
    this->server.addHandler(Logger.getSocket());
  }

public:
  WebServer(Config &_config, PersistentConfig &_persistentConfig, BrewfatherCatalog &_catalog, Scales &_scales, Recorder &_recorder) :
    config(_config), persistentConfig(_persistentConfig), catalog(_catalog), scales(_scales), recorder(_recorder), server(_config.httpPort) {
    MDNS.addService("http", "tcp", this->config.httpPort);
  }

  void begin() {
    this->addRootHandler();
    this->addConfigHandler();
    this->addPersistHandler();
    this->addCatalogHandlers();
    this->addRecordingHandlers();
    this->addScalesHandler();
    this->addStatusHandler();
    this->addLogHandler();
    // makes local testing of web ui easier
    DefaultHeaders::Instance().addHeader("Access-Control-Allow-Origin", "*");
    DefaultHeaders::Instance().addHeader("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
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
