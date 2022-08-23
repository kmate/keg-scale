#ifndef __CONFIG_H
#define __CONFIG_H

#include <ArduinoJson.h>
#include <FS.h>
#include <LittleFS.h>

struct WiFiConfig {
  char ssid[64];
  char passphrase[64];
};

class Config {

public:
  char hostname[64];
  WiFiConfig wifi;

  bool load() {
    File configFile = LittleFS.open("/config.json", "r");
    if (!configFile) {
      return false;
    }

    StaticJsonDocument<256> doc;
    DeserializationError error = deserializeJson(doc, configFile);
    if (error) {
      return false;
    }

    strlcpy(this->hostname, doc["hostname"] | "keg-scale", sizeof(this->hostname));
    strlcpy(this->wifi.ssid, doc["wifi"]["ssid"], sizeof(this->wifi.ssid));
    strlcpy(this->wifi.passphrase, doc["wifi"]["passphrase"], sizeof(this->wifi.passphrase));

    configFile.close();
    return true;
  }
};

#endif
