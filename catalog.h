#ifndef KEG_SCALE__CATALOG_H
#define KEG_SCALE__CATALOG_H

#include <ArduinoJson.h>
#include <ESPDateTime.h>
#include <ESP8266HTTPClient.h>
#include <WiFiClientSecureBearSSL.h>
#include <umm_malloc/umm_heap_select.h>
#include <time.h>
#include <vector>

#include "config.h"
#include "logger.h"

#define CATALOG_REFRESH_SECONDS   86400 // once a day - could be forced if needed anyways
#define CATALOG_MAX_RESPONSE_SIZE 4096

static const char *BREWFATHER_CATALOG_URL = "https://api.brewfather.app/v2/batches?status=Conditioning&include=batchNo,recipe.name,recipe.color,measuredBottlingSize,measuredFg,measuredAbv,bottlingDate";

struct CatalogEntry {
  char id[32];
  uint8_t number;
  char name[128];
  time_t bottlingDate;
  float bottlingVolume;
  float finalGravity;
  float abv;
  float srm;

  void render(JsonObject &obj) {
    obj["id"] = this->id;
    obj["number"] = this->number;
    obj["name"] = this->name;
    obj["bottlingDate"] = DateFormatter::format(DateFormatter::DATE_ONLY, this->bottlingDate);
    obj["bottlingVolume"] = this->bottlingVolume;
    obj["finalGravity"] = this->finalGravity;
    obj["abv"] = this->abv;
    obj["srm"] = this->srm;
  }

  static CatalogEntry *fromJson(const JsonObject &obj) {
    CatalogEntry *entry = new CatalogEntry;
    strlcpy(entry->id, obj["id"] | "", sizeof(entry->id));
    entry->number = obj["number"] | 0;
    strlcpy(entry->name, obj["name"] | "", sizeof(entry->name));

    struct tm bottlingDateTm = {0};
    strptime(obj["bottlingDate"], "%Y-%m-%d", &bottlingDateTm);
    entry->bottlingDate = mktime(&bottlingDateTm);

    entry->bottlingVolume = obj["bottlingVolume"];
    entry->finalGravity = obj["finalGravity"];
    entry->abv = obj["abv"];
    entry->srm = obj["srm"];
    return entry;
  }
};

class BrewfatherCatalog {

private:
  BearSSL::WiFiClientSecure *client;
  bool useMFL;
  int lastStatusCode;
  String lastErrorMessage;

  BrewfatherCatalogConfig *config;
  time_t lastRefresh;
  std::vector<CatalogEntry> entries;

public:
  void begin(BrewfatherCatalogConfig *_config, BearSSL::WiFiClientSecure *_client) {
    this->config = _config;
    this->client = _client;
    {
      HeapSelectIram ephemeral;
      this->useMFL = this->client->probeMaxFragmentLength(BREWFATHER_CATALOG_URL, 443, 512);
      Serial.printf("Brewfather catalog:%s using MFLN.\n", this->useMFL ? "" : " NOT");
    }
    this->lastStatusCode = 0;
    this->lastErrorMessage = String("");
    this->lastRefresh = 0;
    this->entries.clear();
  }

  void update() {
    // the next update will execute in the loop
    this->lastRefresh = 0;
  }

  void handle() {
    HeapSelectIram ephemeral;

    time_t now = DateTime.now();
    time_t elapsed = now - this->lastRefresh;
    if (elapsed < CATALOG_REFRESH_SECONDS) {
      return;
    }

    Logger.printWithFreeHeaps("[BrewfatherCatalog] Update started");

    this->client->setBufferSizes(this->useMFL ? CATALOG_MAX_RESPONSE_SIZE : 512, 512);

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

            Logger.printWithFreeHeaps("[BrewfatherCatalog] Update in progress");

            uint8_t numEntries = entriesToParse.size();
            for (int i = 0; i < numEntries; ++i) {
              CatalogEntry currentEntry;
              strlcpy(currentEntry.id, entriesToParse[i]["_id"], sizeof(currentEntry.id));
              currentEntry.number = entriesToParse[i]["batchNo"];
              strlcpy(currentEntry.name, entriesToParse[i]["recipe"]["name"], sizeof(currentEntry.name));
              currentEntry.bottlingDate = (int)(entriesToParse[i]["bottlingDate"].as<double>() / 1000l);
              currentEntry.bottlingVolume = entriesToParse[i]["measuredBottlingSize"];
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

    Logger.printWithFreeHeaps("[BrewfatherCatalog] Update done");
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
