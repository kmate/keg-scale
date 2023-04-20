#ifndef KEG_SCALE__RECORDER_H
#define KEG_SCALE__RECORDER_H

#include <ESPDateTime.h>
#include <ESP8266HTTPClient.h>
#include <WiFiClientSecureBearSSL.h>
#include <umm_malloc/umm_heap_select.h>
#include <vector>

#include "config.h"

#define RECORDER_MAX_RESPONSE_SIZE 4096

const char *GITHUB_GIST_RECORDER_GQL_URL = "https://api.github.com/graphql";
const char *GITHUB_GIST_RECORDER_GQL_ROOT_QUERY = "query{node(id:\"%s\"){... on Gist{files{text}}}}\0";

class GithubGistRecorder {

private:
  BearSSL::WiFiClientSecure *client;
  bool useMFL;
  int lastStatusCode;
  String lastErrorMessage;

  GithubGistRecorderConfig *config;

public:
  void downloadRecordingData() {
    HeapSelectIram ephemeral;

    HTTPClient https;

    if (https.begin(*client, GITHUB_GIST_RECORDER_GQL_URL)) {
      https.setAuthorization(this->config->userId, this->config->apiKey);
      char *requestBody = new char[strlen(GITHUB_GIST_RECORDER_GQL_URL) + strlen(this->config->rootNodeId)];
      sprintf(requestBody, GITHUB_GIST_RECORDER_GQL_ROOT_QUERY, this->config->rootNodeId);
      this->lastStatusCode = https.POST(requestBody);

// TODO this prints -1 then the stuff gets hanging and WDT kicks...
      Serial.printf("Status code: %d\n", lastStatusCode);
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
            Serial.printf("Number of recorder entries: %d\n", entriesToParse.size());
          }

        }
      } else {
        this->lastErrorMessage = https.errorToString(this->lastStatusCode);
      }

      https.end();
      delete[] requestBody;
    } else {
      this->lastErrorMessage = String("Unable to connect to the target host.");
    }
  };

  void begin(GithubGistRecorderConfig *_config, BearSSL::WiFiClientSecure *_client) {
    this->config = _config;
    this->client = _client;
    {
      HeapSelectIram ephemeral;
      this->useMFL = this->client->probeMaxFragmentLength(GITHUB_GIST_RECORDER_GQL_URL, 443, 512);
      Serial.printf("Github gist recorder:%s using MFLN.\n", this->useMFL ? "" : " NOT");

      // FIXME see the issue above in the method body
      //yield();
      //this->downloadRecordingData();
    }
    this->lastStatusCode = 0;
    this->lastErrorMessage = String("");
  }
  // TODO: implement an update method and call it in the loop
  //  - maintain flag(s?) if the current in-memory data is saved properly; save if not
  //  - try to save root data immediately on change
  //  - but only save scale data periodically (sync with catalog; schedule to different minutes)
  // TODO
  //  - we might be ok with the if from the Location header on create; but don't read the body - a smaller buffer could be sufficient?
  //  - then we need to be able to query a gist by id, not node id! (if that's possible at all)

  // TODO implement a method that scales can call to update the current value

  // TODO implement a method that the web server can use to get the recording data

  // TODO impelent methods to begin/pause/continue/finish recording
};

#endif
