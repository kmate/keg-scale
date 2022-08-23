#include <Arduino.h>
#include <ArduinoOTA.h>
#include <ESP8266mDNS.h>
#include <ESP8266WiFi.h>
#include <ESPAsyncWebServer.h>
#include <FS.h>
#include <LittleFS.h>

#include "config.h"

Config config;
AsyncWebServer server(80);

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
}

void setupWiFi() {
  WiFi.mode(WIFI_STA);
  WiFi.begin(config.wifi.ssid, config.wifi.passphrase);
  while (WiFi.waitForConnectResult() != WL_CONNECTED) {
    failSetup("WiFi connection failed!");
  }
  Serial.print("WiFi connected. IP address: ");
  Serial.print(WiFi.localIP());
  Serial.println(".");
}

void setupOTA() {
  static volatile bool updatingFS = false;

  ArduinoOTA.setHostname(config.hostname);

  // No authentication by default
  // ArduinoOTA.setPassword("admin");

  // Password can be set with it's md5 value as well
  // MD5(admin) = 21232f297a57a5a743894a0e4a801fc3
  // ArduinoOTA.setPasswordHash("21232f297a57a5a743894a0e4a801fc3");

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

void setupHTTP() {
  server.on("/", HTTP_GET, [](AsyncWebServerRequest *request) {
    request->send(LittleFS, "/index.html");
  });
  server.begin();
  MDNS.addService("http", "tcp", 80);
  Serial.println("HTTP server started.");
}

void setup() {
  Serial.begin(115200);
  Serial.println("Booting...");

  setupFS();
  setupConfig();
  setupWiFi();
  setupOTA();
  setupHTTP();
}

void loop() {
  ArduinoOTA.handle();
}
