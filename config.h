#ifndef KEG_SCALE__CONFIG_H
#define KEG_SCALE__CONFIG_H

#include <ArduinoJson.h>
#include <FS.h>
#include <LittleFS.h>
#include <vector>

struct WiFiConfig {
  char ssid[64];
  char passphrase[64];
};

struct OTAConfig {
  uint16_t port;
  char password[64];
};

struct ScaleConfig {
  uint8_t clockPin;
  uint8_t dataPin;
  uint8_t gain;
  bool reverse;
};

class Config {

public:
  char hostname[64];
  uint16_t httpPort;
  WiFiConfig wifi;
  OTAConfig ota;
  std::vector<ScaleConfig> scales;

  bool load() {
    File configFile = LittleFS.open("/config.json", "r");
    if (!configFile) {
      return false;
    }

    StaticJsonDocument<512> doc;
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

    uint8_t numScales = doc["scales"].size() | 0;
    for (int i = 0; i < numScales; ++i) {
      ScaleConfig currentScale;
      currentScale.clockPin = doc["scales"][i]["clockPin"];
      currentScale.dataPin = doc["scales"][i]["dataPin"];
      currentScale.gain = doc["scales"][i]["gain"] | 128;
      currentScale.reverse = (doc["scales"][i]["reverse"] | false);
      this->scales.push_back(currentScale);
    }

    configFile.close();
    return true;
  }
};

#endif
