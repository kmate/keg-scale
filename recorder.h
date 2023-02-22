#ifndef KEG_SCALE__RECORDER_H
#define KEG_SCALE__RECORDER_H

#include "config.h"

#include <ESPDateTime.h>
#include <ESP8266HTTPClient.h>
#include <WiFiClientSecureBearSSL.h>
#include <umm_malloc/umm_heap_select.h>
#include <vector>

#define RECORDER_MAX_RESPONSE_SIZE 4096

const char *GITHUB_GIST_RECORDER_GQL_URL = "https://api.github.com/graphql";

class GithubGistRecorder {

private:
  // TODO share client with catalog?
  BearSSL::WiFiClientSecure *client;

public:
  void begin() {
    // TODO save if we can use MFLN to a flag and set buffer size on shared client each time?
    // TODO load all recording data (root + scales), fail if cannot download (reset ESP in setup then)
    {
      HeapSelectIram ephemeral;
      this->client = new BearSSL::WiFiClientSecure();
      if (this->client->probeMaxFragmentLength(GITHUB_GIST_RECORDER_GQL_URL, 443, 512)) {
        Serial.println("Github gist recorder: using MFLN.");
        this->client->setBufferSizes(512, 512);
      } else {
        Serial.println("Github gist recorder: NOT using MFLN.");
        this->client->setBufferSizes(RECORDER_MAX_RESPONSE_SIZE, 512);
      }
      this->client->setInsecure();
    }
  }
  // TODO: implement an update method and call it in the loop
  //  - maintain flag(s?) if the current in-memory data is saved properly; save if not
  //  - try to save root data immediately
  //  - but only save scale data periodically (sync with catalog; schedule to different minutes)
  // TODO
  //  - we might be ok with the if from the Location header on create; but don't read the body - a smaller buffer could be sufficient?
  //  - then we need to be able to query a gist by id, not node id! (if that's possible at all)

  // TODO implement a method that scales can call to update the current value

  // TODO implement a method that the web server can use to get the recording data

  // TODO impelent methods to begin/pause/continue/finish recording
};

#endif
