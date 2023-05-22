import { Chart, Scale } from "chart.js";
import dayjs from "dayjs";

export default class PourScale extends Scale {
  determineDataLimits() {
    const { min, max } = this.getMinMax(false);
    this.min = min;
    this.max = max;
  }

  // Generate tick marks. this.chart is the chart instance. The data object can be accessed as this.chart.data
  // buildTicks() should create a ticks array on the axis instance, if you intend to use any of the implementations from the base class
  buildTicks() {
    console.log(
      this.#ticksBetween(this.chart.data.labels[0], this.chart.data.labels[1])
    );
    /*
    const ticks = [];
    this.chart.data.labels.reduce((pv, cv) => {
      ticks.push(this.#ticksBetween(pv, cv));
      return cv;
    })
    console.log(ticks.flat);
    */
    console.log("buildTicks", this.min, this.max, this);
    this.ticks = [
      { value: this.min, x: 50 + this.left + this._margins.left },
      { value: this.max, x: 300 + this.left + this._margins.left },
    ];
    return this.ticks;
  }

  // assuming that b > a
  #ticksBetween(a, b) {
    const da = dayjs(a);
    const db = dayjs(b);
    console.log(da, db, da.isBefore(db), da.isAfter(db));

    return [];
  }

  // Get the label to show for the given value
  getLabelForValue(value) {
    console.log("getLabelForValue", value);
    return value;
  }

  // Get the pixel (x coordinate for horizontal axis, y coordinate for vertical axis) for a given value
  // @param index: index into the ticks array
  getPixelForTick(index) {
    // console.log("getPixelForTick", index);
    return this.ticks[index].x;
  }

  // Get the pixel (x coordinate for horizontal axis, y coordinate for vertical axis) for a given value
  // @param value : the value to get the pixel for
  // @param [index] : index into the data array of the value
  getPixelForValue(value, index) {
    //console.log("getPixelForValue", value, index);
    return index * 10 + this.left + 1; // note that the +1 is needed for the fixed Y axis to work properly...
  }

  // Get the value for a given pixel (x coordinate for horizontal axis, y coordinate for vertical axis)
  // @param pixel : pixel value
  getValueForPixel(pixel) {
    console.log("getValueForPixel", pixel);
    return pixel / 10;
  }
}

PourScale.id = "pour";

Chart.register(PourScale);
