#ifndef KEG_SCALE__CATALOG_H
#define KEG_SCALE__CATALOG_H

#include "config.h"

#include <ArduinoJson.h>
#include <ESPDateTime.h>
#include <ESP8266HTTPClient.h>
#include <WiFiClientSecureBearSSL.h>
#include <umm_malloc/umm_heap_select.h>
#include <vector>

#define CATALOG_REFRESH_SECONDS   300
#define CATALOG_MAX_RESPONSE_SIZE 4096

const char *BREWFATHER_CATALOG_URL = "https://api.brewfather.app/v2/batches?status=Conditioning&include=batchNo,recipe.name,recipe.color,measuredBottlingSize,measuredFg,measuredAbv,bottlingDate";

struct CatalogEntry {
  char id[32];
  uint8_t number;
  char name[128];
  time_t bottlingDate;
  float bottlingSize;
  float finalGravity;
  float abv;
  float srm;

  void render(JsonObject &obj) {
    obj["id"] = this->id;
    obj["number"] = this->number;
    obj["name"] = this->name;
    obj["bottlingDate"] = DateFormatter::format(DateFormatter::DATE_ONLY, this->bottlingDate);
    obj["bottlingSize"] = this->bottlingSize;
    obj["finalGravity"] = this->finalGravity;
    obj["abv"] = this->abv;
    obj["srm"] = this->srm;
  }
};

class BrewfatherCatalog {

private:
  BearSSL::WiFiClientSecure *client;
  BrewfatherCatalogConfig *config;
  time_t lastRefresh;
  int lastStatusCode;
  String lastErrorMessage;
  std::vector<CatalogEntry> entries;

public:
  void begin(BrewfatherCatalogConfig *_config) {
    {
      HeapSelectIram ephemeral;
      this->client = new BearSSL::WiFiClientSecure();
      if (this->client->probeMaxFragmentLength(BREWFATHER_CATALOG_URL, 443, 512)) {
        Serial.println("Brewfather catalog: using MFLN.");
        this->client->setBufferSizes(512, 512);
      } else {
        Serial.println("Brewfather catalog: NOT using MFLN.");
        this->client->setBufferSizes(CATALOG_MAX_RESPONSE_SIZE, 512);
      }
      this->client->setInsecure();
    }

    this->config = _config;
    this->lastRefresh = 0;
    this->lastStatusCode = 0;
    this->lastErrorMessage = String("");
    this->entries.clear();
  }

  void forceUpdate() {
    // the next update will execute in the loop
    this->lastRefresh = 0;
  }

  void update() {
    HeapSelectIram ephemeral;

    time_t now = DateTime.now();
    time_t elapsed = now - this->lastRefresh;
    if (elapsed < CATALOG_REFRESH_SECONDS) {
      return;
    }

    HTTPClient https;

    if (https.begin(*client, BREWFATHER_CATALOG_URL)) {
      https.setAuthorization(this->config->userId, this->config->apiKey);
      this->lastStatusCode = https.GET();

      if (this->lastStatusCode > 0) {
        this->lastErrorMessage = String("");

        if (this->lastStatusCode == HTTP_CODE_OK || this->lastStatusCode == HTTP_CODE_MOVED_PERMANENTLY) {
          String payload = https.getString();
          DynamicJsonDocument doc(CATALOG_MAX_RESPONSE_SIZE);
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
              currentEntry.bottlingDate = (int)(entriesToParse[i]["bottlingDate"].as<double>() / 1000l);
              currentEntry.bottlingSize = entriesToParse[i]["measuredBottlingSize"];
              currentEntry.finalGravity = entriesToParse[i]["measuredFg"].as<float>() * 1000.0;
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
