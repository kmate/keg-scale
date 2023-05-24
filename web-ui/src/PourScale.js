import { Chart, Scale } from "chart.js";
import dayjs from "dayjs";

const ceil = (_, dayjsClass) => {
  dayjsClass.prototype.ceil = function (amount, unit) {
    return this.add(amount - (this.get(unit) % amount), unit).startOf(unit);
  };
};

dayjs.extend(ceil);

export const POUR_GAP_SECONDS = 10;

export default class PourScale extends Scale {
  determineDataLimits() {
    const { min, max } = this.getMinMax(false);
    this.min = min;
    this.max = max;
  }

  buildTicks() {
    const timestamps = this.chart.data.labels;
    const dataset = this.chart.data.datasets[0].data;
    const timestampToValue = new Map(
      timestamps.map((timestamp, index) => {
        const value = dataset[index];
        return [timestamp, value];
      })
    );
    const compressedTicks = this.#compressedTimeTicks(timestamps);
    const { filtered, pours } = this.#derivePours(
      compressedTicks,
      timestampToValue
    );

    this.pours = pours;
    this.ticks = this.#deriveTickLabelAndPosition(filtered);
    this.timestampToTick = new Map(
      this.ticks.map((tick) => [tick.timestamp, tick])
    );

    return this.ticks;
  }

  // assuming that timestamps.length > 0
  #compressedTimeTicks(timestamps) {
    // clone original array for sure
    timestamps = [...timestamps];
    const head = timestamps.shift();
    const ticks = timestamps
      .reduce(
        ({ ticks, previous }, current) => {
          ticks.push(this.#ticksBetween(previous, current));
          return { ticks, previous: current };
        },
        { ticks: [], previous: head }
      )
      .ticks.flat();

    // adds last item
    ticks.push({
      timestamp: dayjs(timestamps[timestamps.length - 1]),
      jump: null,
    });

    return ticks;
  }

  // assuming that start.isBefore(start)
  #ticksBetween(start, end) {
    const ticks = [];

    let nextTick = { timestamp: start, jump: null };
    if (end.diff(start, "hour") >= 6) {
      ticks.push(nextTick);
      const ceilArgs =
        end.diff(nextTick.timestamp, "day") >= 1
          ? [1, "day"]
          : end.diff(nextTick.timestamp, "hour") >= 12
          ? [12, "hour"]
          : [6, "hour"];
      nextTick = {
        timestamp: start.ceil.apply(start, ceilArgs),
        jump: ceilArgs,
      };
    }

    do {
      ticks.push(nextTick);
      const nextTimestamp = nextTick.timestamp;
      const addArgs =
        end.diff(nextTimestamp, "month") >= 1
          ? [1, "month"]
          : end.diff(nextTimestamp, "week") >= 4
          ? [4, "week"]
          : end.diff(nextTimestamp, "week") >= 3
          ? [3, "week"]
          : end.diff(nextTimestamp, "week") >= 2
          ? [2, "week"]
          : end.diff(nextTimestamp, "week") >= 1
          ? [1, "week"]
          : end.diff(nextTimestamp, "day") >= 6
          ? [6, "day"]
          : end.diff(nextTimestamp, "day") >= 5
          ? [5, "day"]
          : end.diff(nextTimestamp, "day") >= 4
          ? [4, "day"]
          : end.diff(nextTimestamp, "day") >= 3
          ? [3, "day"]
          : end.diff(nextTimestamp, "day") >= 2
          ? [2, "day"]
          : end.diff(nextTimestamp, "day") >= 1
          ? [1, "day"]
          : end.diff(nextTimestamp, "hour") >= 12
          ? [12, "hour"]
          : [4, "hour"];
      nextTick = {
        timestamp: nextTimestamp.add.apply(nextTimestamp, addArgs),
        jump: addArgs,
      };
    } while (nextTick.timestamp.isBefore(end));

    return ticks;
  }

  #derivePours(compressedTicks, timestampToValue) {
    let currentPour = null;
    const numTicks = compressedTicks.length;
    const pours = [];
    const filtered = compressedTicks.filter((current, index) => {
      if (index == numTicks - 1) {
        if (currentPour != null) {
          // finish existing pour
          currentPour.end = current.timestamp;
          currentPour.endValue = timestampToValue.get(current.timestamp);
          pours.push(currentPour);
          currentPour = null;
        }
        // always include last tick
        return true;
      } else {
        const next = compressedTicks[index + 1];
        const secondsToNext = next.timestamp.diff(
          current.timestamp,
          "second",
          true
        );

        if (currentPour != null && secondsToNext > POUR_GAP_SECONDS) {
          // finish existing pour
          currentPour.end = current.timestamp;
          currentPour.endValue = timestampToValue.get(current.timestamp);
          pours.push(currentPour);
          currentPour = null;
          // always include end tick
          return true;
        }

        if (
          currentPour == null &&
          current.jump == null &&
          secondsToNext <= POUR_GAP_SECONDS
        ) {
          // start new pour
          currentPour = {
            start: current.timestamp,
            startValue: timestampToValue.get(current.timestamp),
          };
          // always include start tick
          return true;
        }

        // ignore mid-pour points
        return currentPour == null;
      }
    });

    return { filtered, pours };
  }

  #deriveTickLabelAndPosition(filteredTicks) {
    const POUR_SECOND_WIDTH = 5;
    const NON_POUR_SECOND_WIDTH = 80 / (60 * 60);
    const HOUR_JUMP_WIDTH = 10;
    const OTHER_JUMP_WIDTH = 40;

    const numTicks = filteredTicks.length;
    let lastX = 0;
    return filteredTicks.map(({ timestamp, jump }, index) => {
      let label = "";
      if (index == 0) {
        label = [timestamp.format("MMM D."), timestamp.format("HH:mm")];
      } else if (jump == null) {
        label = timestamp.format("HH:mm");
        const previous = filteredTicks[index - 1];
        const secondsSinceLast = timestamp.diff(
          previous.timestamp,
          "second",
          true
        );

        const pour = this.#pourForTimestamp(timestamp);
        if (pour) {
          // almost all ticks should fall into this
          const isStart = pour.start == timestamp;
          const isEnd = pour.end == timestamp;
          lastX += isStart
            ? secondsSinceLast * NON_POUR_SECOND_WIDTH
            : secondsSinceLast * POUR_SECOND_WIDTH;

          if (isStart) {
            pour.startX = lastX;
          } else if (isEnd) {
            // have the tick mark but no label for it
            // (pour marker will show the elapsed time)
            label = "";
            pour.endX = lastX;
          }
        } else {
          // this must be the tick of the last data point - i.e. "now"
          lastX += secondsSinceLast * NON_POUR_SECOND_WIDTH;
        }
      } else {
        const [jumpAmount, jumpUnit] = jump;
        if (jumpUnit == "hour") {
          if (timestamp.hour() == 0 && timestamp.minute() == 0) {
            label = [timestamp.format("MMM"), timestamp.format("D.")];
          } else {
            label = [timestamp.format("HH:mm")];
          }
          lastX += jumpAmount * HOUR_JUMP_WIDTH;
        } else {
          label = [timestamp.format("MMM"), timestamp.format("D.")];
          lastX += OTHER_JUMP_WIDTH;
        }

        if (index < numTicks - 1) {
          const next = filteredTicks[index + 1];
          const hoursToNext = next.timestamp.diff(timestamp, "hour", true);
          // do not add label to ticks too close before pour ticks
          if (next.jump == null && hoursToNext <= 1) {
            label = "";
          }
        }
      }

      return { value: label, x: lastX, timestamp: timestamp };
    });
  }

  #pourForTimestamp(timestamp) {
    return this.pours.find(
      (pour) => !pour.start.isAfter(timestamp) && !pour.end.isBefore(timestamp)
    );
  }

  getPixelForTick(index) {
    return this._startPixel + this.ticks[index].x;
  }

  // Get the pixel (x coordinate for horizontal axis, y coordinate for vertical axis) for a given value
  // @param value : the value to get the pixel for
  // @param [index] : index into the data array of the value
  getPixelForValue(_value, index) {
    // TODO cache this data for better performance when generating ticks and pours
    const timestamps = this.chart.data.labels;
    const timestamp = timestamps[index];

    const tick = this.timestampToTick.get(timestamp);
    if (tick) {
      return this._startPixel + tick.x + 1;
    }

    const pour = this.#pourForTimestamp(timestamp);
    if (pour) {
      const pourWidth = pour.endX - pour.startX;
      const pourSeconds = pour.end.diff(pour.start, "second", true);
      const secondsFromStart = timestamp.diff(pour.start, "second", true);
      const pourX = pour.startX + pourWidth * (secondsFromStart / pourSeconds);
      return this._startPixel + pourX + 1;
    }

    // this must be the last point
    const lastTick = this.ticks[this.ticks.length - 1];
    return this._startPixel + lastTick.x + 1;
  }

  // Get the label to show for the given value
  getLabelForValue(value) {
    // seems to be unused in this implementation
    return value;
  }

  // Get the value for a given pixel (x coordinate for horizontal axis, y coordinate for vertical axis)
  // @param pixel : pixel value
  getValueForPixel() {
    // seems to be unused in this implementation
    return null;
  }

  draw(chartArea) {
    super.draw(chartArea);

    const ctx = this.chart.ctx;
    ctx.save();
    this.pours.map((pour, index) => {
      const pourX = this._startPixel + pour.startX;
      const pourWidth = pour.endX - pour.startX;
      const pourMiddle = pourX + pourWidth / 2;

      // draw background
      ctx.fillStyle = "rgba(0, 0, 0, 0.3)";
      ctx.fillRect(pourX, chartArea.top, pourWidth, chartArea.height);

      // draw volume
      const digits = this.options.ticks.digits;
      const pourVolume = pour.startValue - pour.endValue;
      const displayVolume = Number(pourVolume).toFixed(digits);
      const volumeY = chartArea.top + 22;
      ctx.font = "bold 22px " + this.options.ticks.font.family;
      ctx.textAlign = "center";
      ctx.fillStyle = this.options.ticks.pourColor;
      ctx.lineWidth = 0.75;
      ctx.strokeStyle = "white";
      ctx.fillText(displayVolume, pourMiddle, volumeY);
      ctx.strokeText(displayVolume, pourMiddle, volumeY);

      // draw pour number and seconds taken
      const pourSeconds = pour.end.diff(pour.start, "second");
      const pourMeta = `(#${index + 1}, ${pourSeconds}s)`;
      const secondsY = 58;
      ctx.font = "bold 16px " + this.options.ticks.font.family;
      ctx.fillStyle = "rgba(0, 0, 0, 0.8)";
      ctx.fillText(pourMeta, pourMiddle, secondsY);
    });
    ctx.restore();
  }
}

PourScale.id = "pour";

Chart.register(PourScale);
