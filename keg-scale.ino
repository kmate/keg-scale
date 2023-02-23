#include <Arduino.h>
#include <ArduinoOTA.h>
#include <ESP8266WiFi.h>
#include <ESPDateTime.h>
#include <FS.h>
#include <LittleFS.h>
#include <vector>

#include "config.h"
#include "persistent_config.h"
#include "logger.h"
#include "catalog.h"
#include "recorder.h"
#include "scale.h"
#include "webserver.h"

Config config;
PersistentConfig persistentConfig;
BrewfatherCatalog catalog;
GithubGistRecorder recorder;
std::vector<Scale*> scales;
WebServer *server;

void failSetup(const char *message) {
  Serial.print(message);
  Serial.println(" Rebooting...");
  delay(5000);
  ESP.restart();
}

void setupFS() {
  if (!LittleFS.begin()) {
    failSetup("LittleFS mount failed!");
  }
}

void setupConfig() {
  if (!config.load()) {
    failSetup("Loading config failed!");
  }

  persistentConfig.load(config.scales.size());
}

void setupWiFi() {
  WiFi.mode(WIFI_STA);
  WiFi.disconnect();
  delay(100);

  int numNetworks = WiFi.scanNetworks();
  int numSSIDs = config.wifis.size();
  for (int i = 0; i < numNetworks; ++i) {
    for (int j = 0; j < numSSIDs; ++j) {
      if (String(config.wifis[j].ssid) == WiFi.SSID(i)) {
        WiFi.begin(config.wifis[j].ssid, config.wifis[j].passphrase);
        if (WiFi.waitForConnectResult() == WL_CONNECTED) {
          break;
        }
      }
    }
  }
  if (WiFi.status() != WL_CONNECTED) {
    failSetup("WiFi connection failed!");
  }
  Serial.print("WiFi connected. IP address: ");
  Serial.print(WiFi.localIP());
  Serial.println(".");
}

void setupOTA() {
  static volatile bool updatingFS = false;

  ArduinoOTA.setHostname(config.hostname);
  ArduinoOTA.setPort(config.ota.port);
  if (strlen(config.ota.password) > 0) {
    ArduinoOTA.setPassword(config.ota.password);
  }

  ArduinoOTA.onStart([]() {
    String type;
    if (ArduinoOTA.getCommand() == U_FLASH) {
      type = "sketch";
      updatingFS = false;
    } else { // U_FS
      type = "filesystem";
      updatingFS = true;
      LittleFS.end();
    }

    Logger.println("OTA in progress, closing connection.");
    Logger.end();

    Serial.println("OTA begins for " + type);
  });
  ArduinoOTA.onEnd([]() {
    Serial.println("\nOTA finished.");
    if (updatingFS) {
      setupFS();
    }
  });
  ArduinoOTA.onProgress([](unsigned int progress, unsigned int total) {
    Serial.printf("OTA progress: %u%%\r", (progress / (total / 100)));
  });
  ArduinoOTA.onError([](ota_error_t error) {
    Serial.printf("OTA error[%u]: ", error);
    if (error == OTA_AUTH_ERROR) {
      Serial.println("Auth Failed");
    } else if (error == OTA_BEGIN_ERROR) {
      Serial.println("Begin Failed");
    } else if (error == OTA_CONNECT_ERROR) {
      Serial.println("Connect Failed");
    } else if (error == OTA_RECEIVE_ERROR) {
      Serial.println("Receive Failed");
    } else if (error == OTA_END_ERROR) {
      Serial.println("End Failed");
    }
  });
  ArduinoOTA.begin();
}

void setupDateTime() {
  DateTime.setTimeZone("UTC0");
  DateTime.begin();
  if (!DateTime.isTimeValid()) {
    failSetup("Failed to get time from server!");
  }
}

void setupCatalog() {
  catalog.begin(&config.catalog.brewfather);
}

void setupRecorder() {
  recorder.begin();
}

void setupScales() {
  for (int i = 0; i < config.scales.size(); ++i) {
    Scale *scale = new Scale(config.scales[i], persistentConfig.getCalibrationForScale(i));
    scales.push_back(scale);
    scale->begin();
  }
  Serial.println("Scales initialized.");
}

void setupHTTP() {
  server = new WebServer(config, persistentConfig, catalog, scales);
  server->begin();
  Serial.println("HTTP server started.");
}

void setup() {
  Serial.begin(115200);
  Serial.println("Booting...");

  setupFS();
  setupConfig();
  setupWiFi();
  setupOTA();
  setupDateTime();
  setupCatalog();
  setupRecorder();
  setupScales();
  setupHTTP();
}

void loop() {
  ArduinoOTA.handle();
  yield();
  catalog.update();
  yield();
  for (Scale *scale : scales) {
    scale->update();
    yield();
  }
}
