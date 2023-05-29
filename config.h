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
  char label[64];
  uint8_t clockPin;
  uint8_t dataPin;
  uint8_t gain;
  bool reverse;
  unsigned long initMillis;
  bool initTare;

  void render(JsonObject &obj) {
    obj["label"] = this->label;
    obj["clockPin"] = this->clockPin;
    obj["dataPin"] = this->dataPin;
    obj["gain"] = this->gain;
    obj["reverse"] = this->reverse;
    obj["initMillis"] = this->initMillis;
    obj["initTare"] = this->initTare;
  }
};

struct Weight {
  char label[64];
  uint16_t mass;
  bool forTare;
  bool forCalibration;

  void render(JsonObject &obj) {
    obj["label"] = this->label;
    obj["mass"] = this->mass;
    obj["forTare"] = this->forTare;
    obj["forCalibration"] = this->forCalibration;
  }
};

struct BrewfatherCatalogConfig {
  char userId[32];
  char apiKey[65];
};

struct CatalogConfig {
  BrewfatherCatalogConfig brewfather;
};

class Config {

public:
  char hostname[64];
  uint16_t httpPort;
  std::vector<WiFiConfig> wifis;
  CatalogConfig catalog;
  OTAConfig ota;
  std::vector<ScaleConfig> scales;
  std::vector<Weight> weights;

  bool load() {
    File configFile = LittleFS.open("/config.json", "r");
    if (!configFile) {
      return false;
    }

    DynamicJsonDocument doc(2048);
    DeserializationError error = deserializeJson(doc, configFile);
    if (error) {
      return false;
    }

    strlcpy(this->hostname, doc["hostname"] | "keg-scale", sizeof(this->hostname));
    this->httpPort = doc["httpPort"] | 80;

    uint8_t numWifis = doc["wifis"].size() | 0;
    for (int i = 0; i < numWifis; ++i) {
      WiFiConfig currentWifi;
      strlcpy(currentWifi.ssid, doc["wifis"][i]["ssid"], sizeof(currentWifi.ssid));
      strlcpy(currentWifi.passphrase, doc["wifis"][i]["passphrase"], sizeof(currentWifi.passphrase));
      this->wifis.push_back(currentWifi);
    }

    strlcpy(this->catalog.brewfather.userId, doc["catalog"]["brewfather"]["userId"] | "", sizeof(this->catalog.brewfather.userId));
    strlcpy(this->catalog.brewfather.apiKey, doc["catalog"]["brewfather"]["apiKey"] | "", sizeof(this->catalog.brewfather.apiKey));

    this->ota.port = doc["ota"]["port"] | 8266;
    strlcpy(this->ota.password, doc["ota"]["password"] | "", sizeof(this->ota.password));

    uint8_t numScales = doc["scales"].size() | 0;
    for (int i = 0; i < numScales; ++i) {
      ScaleConfig currentScale;
      strlcpy(currentScale.label, doc["scales"][i]["label"] | (String("Scale ") + String(i)).c_str(), sizeof(currentScale.label));
      currentScale.clockPin = doc["scales"][i]["clockPin"];
      currentScale.dataPin = doc["scales"][i]["dataPin"];
      currentScale.gain = doc["scales"][i]["gain"] | 128;
      currentScale.reverse = doc["scales"][i]["reverse"] | false;
      currentScale.initMillis = doc["scales"][i]["initMillis"] | 5000;
      currentScale.initTare = doc["scales"][i]["initTare"] | false;
      this->scales.push_back(currentScale);
    }

    uint8_t numWeights = doc["weights"].size() | 0;
    for (int i = 0; i < numWeights; ++i) {
      Weight currentWeight;
      strlcpy(currentWeight.label, doc["weights"][i]["label"], sizeof(currentWeight.label));
      currentWeight.mass = doc["weights"][i]["mass"];
      currentWeight.forTare = doc["weights"][i]["forTare"] | false;
      currentWeight.forCalibration = doc["weights"][i]["forCalibration"] | false;
      this->weights.push_back(currentWeight);
    }

    configFile.close();
    return true;
  }
};

#endif
