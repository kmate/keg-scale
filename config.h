#ifndef __CONFIG_H
#define __CONFIG_H

#include <ArduinoJson.h>
#include <FS.h>
#include <LittleFS.h>

struct WiFiConfig {
  char ssid[64];
  char passphrase[64];
};

struct OTAConfig {
  uint16_t port;
  char password[64];
};

class Config {

public:
  char hostname[64];
  uint16_t httpPort;
  WiFiConfig wifi;
  OTAConfig ota;

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
    this->httpPort = doc["httpPort"] | 80;

    strlcpy(this->wifi.ssid, doc["wifi"]["ssid"], sizeof(this->wifi.ssid));
    strlcpy(this->wifi.passphrase, doc["wifi"]["passphrase"], sizeof(this->wifi.passphrase));

    this->ota.port = doc["ota"]["port"] | 8266;
    strlcpy(this->ota.password, doc["ota"]["password"] | "", sizeof(this->ota.password));

    configFile.close();
    return true;
  }

  void addDescriptionToDoc(DynamicJsonDocument &doc) {
    // TODO add more properties when it makes sense
    JsonObject wifi = doc.createNestedObject("wifi");
    wifi["ssid"] = this->wifi.ssid;
  }
};

#endif
