#ifndef KEG_SCALE__CATALOG_H
#define KEG_SCALE__CATALOG_H

#include "config.h"

#include <ArduinoJson.h>
#include <ESPDateTime.h>
#include <ESP8266HTTPClient.h>
#include <WiFiClientSecureBearSSL.h>
#include <vector>

#define CATALOG_REFRESH_SECONDS 300

const char *BREWFATHER_CATALOG_URL = "https://api.brewfather.app/v1/batches?status=Conditioning&include=batchNo,recipe.name,recipe.color,measuredBottlingSize,measuredFg,measuredAbv";

struct CatalogEntry {
  char id[32];
  uint8_t number;
  char name[128];
  time_t brewDate;
  float bottlingSize;
  float finalGravity;
  float abv;
  float srm;

  void render(JsonObject &obj) {
    obj["id"] = this->id;
    obj["number"] = this->number;
    obj["name"] = this->name;
    obj["brewDate"] = DateFormatter::format(DateFormatter::SIMPLE, this->brewDate);
    obj["bottlingSize"] = this->bottlingSize;
    obj["finalGravity"] = this->finalGravity;
    obj["abv"] = this->abv;
    obj["srm"] = this->srm;
  }
};

class BrewfatherCatalog {

private:
  BrewfatherCatalogConfig *config;
  time_t lastRefresh;
  int lastStatusCode;
  String lastErrorMessage;
  std::vector<CatalogEntry> entries;

public:
  void refresh() {
    time_t now = DateTime.now();
    time_t elapsed = now - this->lastRefresh;
    if (elapsed < CATALOG_REFRESH_SECONDS) {
      return;
    }

    std::unique_ptr<BearSSL::WiFiClientSecure> client(new BearSSL::WiFiClientSecure);
    client->setInsecure();
    HTTPClient https;

    if (https.begin(*client, BREWFATHER_CATALOG_URL)) {
      https.setAuthorization(this->config->userId, this->config->apiKey);
      this->lastStatusCode = https.GET();

      if (this->lastStatusCode > 0) {
        this->lastErrorMessage = String("");

        if (this->lastStatusCode == HTTP_CODE_OK || this->lastStatusCode == HTTP_CODE_MOVED_PERMANENTLY) {
          String payload = https.getString();
          DynamicJsonDocument doc(4096);
          DeserializationError error = deserializeJson(doc, payload);

          if (error) {
            this->lastErrorMessage = String(error.c_str());
          } else {
            JsonArray entriesToParse = doc.as<JsonArray>();
            this->entries.clear();

            uint8_t numEntries = entriesToParse.size();
            for (int i = 0; i < numEntries; ++i) {
              CatalogEntry currentEntry;
              strlcpy(currentEntry.id, entriesToParse[i]["_id"], sizeof(currentEntry.id));
              currentEntry.number = entriesToParse[i]["batchNo"];
              strlcpy(currentEntry.name, entriesToParse[i]["recipe"]["name"], sizeof(currentEntry.name));
              currentEntry.brewDate = (int)(entriesToParse[i]["brewDate"].as<double>() / 1000l);
              currentEntry.bottlingSize = entriesToParse[i]["measuredBottlingSize"];
              currentEntry.finalGravity = entriesToParse[i]["measuredFg"];
              currentEntry.abv = entriesToParse[i]["measuredAbv"];
              currentEntry.srm = entriesToParse[i]["recipe"]["color"];
              this->entries.push_back(currentEntry);
            }

            this->lastRefresh = now;
          }
        }
      } else {
        this->lastErrorMessage = https.errorToString(this->lastStatusCode);
      }

      https.end();
    } else {
      this->lastErrorMessage = String("Unable to connect to the target host.");
    }
  }

  void begin(BrewfatherCatalogConfig *_config) {
    this->config = _config;
    this->lastRefresh = 0;
    this->lastStatusCode = 0;
    this->lastErrorMessage = String("");
    this->entries.clear();
  }

  time_t getLastRefresh() {
    return this->lastRefresh;
  }

  int getLastStatusCode() {
    return this->lastStatusCode;
  }

  String& getLastErrorMessage() {
    return this->lastErrorMessage;
  }

  std::vector<CatalogEntry>& getEntries() {
    return this->entries;
  }
};

#endif
