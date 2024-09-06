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

const char compiledAt[] = COMPILED_AT;

class WebServer {

  Config &config;
  PersistentConfig &persistentConfig;
  BrewfatherCatalog &catalog;
  Scales &scales;
  Recorder &recorder;

  AsyncWebServer server;

  void addRootHandler() {
    this->server
      .serveStatic("/", LittleFS, "/html/")
      .setLastModified(config.fsLastModified)
      .setDefaultFile("index.html");
  }

  void addConfigHandler() {
    this->server.on("/config", HTTP_GET, [this](AsyncWebServerRequest *request) {
      AsyncResponseStream *response = request->beginResponseStream("application/json");
      DynamicJsonDocument doc(1536);
      this->config.render(doc);
      serializeJson(doc, *response);
      request->send(response);
    });
  }

  void addPersistentConfigHandler() {
    this->server.on("/persistent-config", HTTP_GET, [this](AsyncWebServerRequest *request) {
      AsyncResponseStream *response = request->beginResponseStream("application/json");
      DynamicJsonDocument doc(1536);
      this->persistentConfig.render(doc);
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
      fs["lastModified"] = config.fsLastModified;
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
    this->addPersistentConfigHandler();
    this->addPersistHandler();
    this->addCatalogHandlers();
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
