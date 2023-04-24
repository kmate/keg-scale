import ReconnectingWebSocket from "reconnecting-websocket";
import PromiseController from "promise-controller";

class Scale {
  #config;
  #index;
  #scales;

  constructor(config, index, scales) {
    this.#config = config;
    this.#index = index;
    this.#scales = scales;
  }

  get index() {
    return this.#index;
  }

  get label() {
    return this.#config.label;
  }

  standby() {
    return this.#scales.sendCommand({ action: "standby", index: this.#index });
  }

  liveMeasurement() {
    return this.#scales.sendCommand({
      action: "liveMeasurement",
      index: this.#index,
    });
  }

  tare() {
    return this.#scales.sendCommand({ action: "tare", index: this.#index });
  }

  calibrate(knownMass) {
    return this.#scales.sendCommand({
      action: "calibrate",
      index: this.#index,
      knownMass: knownMass,
    });
  }

  startRecording(tapEntry) {
    return this.#scales.sendCommand({
      action: "startRecording",
      index: this.#index,
      tapEntry: tapEntry,
    });
  }

  pauseRecording() {
    return this.#scales.sendCommand({
      action: "pauseRecording",
      index: this.#index,
    });
  }

  continueRecording() {
    return this.#scales.sendCommand({
      action: "continueRecording",
      index: this.#index,
    });
  }

  stopRecording() {
    return this.#scales.sendCommand({
      action: "stopRecording",
      index: this.#index,
    });
  }
}

export default class Scales {
  #url;
  #ondata;

  #instances;
  #socket;
  #commandQueue = [];
  #executingCommand = null;

  constructor(url, fullConfig, ondata) {
    this.#url = url;
    this.#ondata = ondata;

    this.#instances = fullConfig.map(
      (config, index) => new Scale(config, index, this)
    );
  }

  open() {
    console.info("Opening scales socket...");
    this.#socket = new ReconnectingWebSocket(this.#url);

    this.#socket.onopen = () => {
      console.info("Scales socket open.");
      this.#scheduleNextCommand();
    };

    this.#socket.onerror = (e) => {
      if (this.#hasExecutingCommand()) {
        this.#executingCommand.promise.reject(e);
        this.#executingCommand = null;
        this.#scheduleNextCommand();
      } else {
        console.warn("Scales socket error.", e);
      }
    };

    this.#socket.onmessage = (e) => {
      const payload = JSON.parse(e.data);
      if (!("type" in payload)) {
        console.warn("Unexpected scale message without type designation.");
        return;
      }

      if (payload.type == "ack") {
        if (!this.#hasExecutingCommand()) {
          console.warn(
            "Scale command acknowledged without execution.",
            payload
          );
          return;
        }
        this.#executingCommand.promise.resolve();
        this.#executingCommand = null;
        this.#scheduleNextCommand();
      } else if (payload.type == "error") {
        if (!this.#hasExecutingCommand()) {
          console.warn("Scale command failed without execution.", payload);
          return;
        }
        this.#executingCommand.promise.reject(payload.message);
        this.#executingCommand = null;
        this.#scheduleNextCommand();
      } else if (payload.type == "data") {
        this.#ondata(payload);
      } else {
        console.warn("Unexpected scale message type: " + payload.type);
      }
    };
  }

  close() {
    this.#socket.close();

    if (this.#hasExecutingCommand()) {
      this.#queueCommand(this.#executingCommand);
      this.#executingCommand = null;
    }

    console.info("Scales socket closed.");
  }

  get instances() {
    return this.#instances;
  }

  sendCommand(payload) {
    const promise = new PromiseController({ timeout: 10000 });
    const command = { payload: payload, promise: promise };
    return promise.call(() => {
      this.#queueCommand(command);
      this.#scheduleNextCommand();
    });
  }

  #queueCommand(command) {
    this.#commandQueue.push(command);
  }

  #hasExecutingCommand() {
    return this.#executingCommand != null;
  }

  #scheduleNextCommand() {
    if (!this.#hasExecutingCommand() && this.#commandQueue.length > 0) {
      this.#executeCommand(this.#commandQueue.shift());
    }
  }

  #executeCommand(command) {
    this.#executingCommand = command;
    this.#socket.send(JSON.stringify(command.payload));
  }
}
