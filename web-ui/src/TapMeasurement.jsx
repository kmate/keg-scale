import * as React from 'react';
import useInterval from 'use-interval'
import { useTheme } from '@mui/material/styles';

import { Box, Divider, FormControl, MenuItem, Select, Typography } from '@mui/material';
import { volumeUnits } from './units';
import TapEntryProperties from './TapEntryProperties';
import srmToRgb from './srmToRgb';

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Filler,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import PourScale from './PourScale';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PourScale,
  PointElement,
  LineElement,
  Tooltip,
  Filler
);

const RENDER_TICK_SECONDS = 60;

const MILLISECONDS_PER_SECOND = 1000;
const SECONDS_PER_HOUR = 60 * 60;
const SECONDS_PER_DAY = 24 * SECONDS_PER_HOUR;

const HOUR_WIDTH = 30;
const DAY_WIDTH = 50;
const POUR_SECOND_WIDTH = 2;

function diffInSeconds(tsA, tsB) {
  return (tsA - tsB) / MILLISECONDS_PER_SECOND;
}

function convertData(rawData, volumeUnit) {
  return Object.keys(rawData)
    .map((key) => { return {
      timestamp: Number(key) * MILLISECONDS_PER_SECOND,
      value: Number((rawData[key] * volumeUnit.multiplier).toFixed(volumeUnit.digits))
    }})
    .sort((a, b) => a.timestamp - b.timestamp);
}

function equalizeData(convertedData) {
  const equalizedData = convertedData.flatMap((current, i, data) => {
    if (i == 0) {
      // first data point, no equalizer
      return [current];
    }

    const previous = data[i - 1];
    const secondsSincePrevious = diffInSeconds(current.timestamp, previous.timestamp);
    if (secondsSincePrevious > 10) {
      // new pour, equalizer should be added
      let equalizerTimeShift = 1;
      if (i + 1 < data.length) {
        const next = data[i + 1];
        equalizerTimeShift = diffInSeconds(next.timestamp, current.timestamp);
      }
      const equalizer = { timestamp: current.timestamp - equalizerTimeShift, value: previous.value };
      return [equalizer, current];
    } else {
      // continuation of an existing pour
      return [current];
    }
  });

  if (equalizedData.length > 0) {
    equalizedData.push({ timestamp: new Date().getTime(), value: equalizedData[equalizedData.length - 1].value });
  }

  return equalizedData;
}

// TODO "compress" time (N pixels for empty 6H windows, M pixels for 1H in the non-empty ones)
function compressData(equalizedData) {
  const lastIndex = equalizeData.length - 1;
  const startState = { result: [], lastX: 0 };

  return equalizedData.reduce(({ result, lastX }, value, index) => {
    value.x = lastX;
    lastX += 10;
    result.push(value);
    return { result, lastX };
  }, startState).result;
}

// TODO derive/group "pours" to be able to mark them on the chart
function derivePours(compressedData) {
  return [];
}

// TODO derive X axis points/ticks
//  - midnight only for empty days,
//  - 6H markers on non-empty window boundaries,
//  - 1H ticks inside the non-empty windows
//  - should we derive the labels here as well?
function deriveXAxisTicks(compressedData) {
  return compressedData;
}

// TODO remove this block after we don't need more code from it to implement the above methods
/*
  .flatMap((current, i, data) => {
    if (i == 0) {
      // first data point
      return [{ ...current, x: x }];
    }

    const previous = data[i - 1];
    const secondsSincePrevious = (current.timestamp - previous.timestamp) / 1000;
    if (secondsSincePrevious > 10) {
      // new pour should be started and the current one should be finished
      x += secondsSincePrevious >= SECONDS_PER_DAY
      ? secondsSincePrevious / SECONDS_PER_DAY * DAY_WIDTH
      : secondsSincePrevious / SECONDS_PER_HOUR * HOUR_WIDTH;

      let equalizerTimeShift = 1;
      if (i + 1 < data.length) {
        const next = data[i + 1];
        equalizerTimeShift = (next.timestamp - current.timestamp) / 1000;
      }
      const equalizer = { timestamp: current.timestamp - equalizerTimeShift, value: previous.value, x: x };
      x += equalizerTimeShift * POUR_SECOND_WIDTH;

      if (currentPour != null) {
        pours.push(currentPour);
        currentPour = { startTime: equalizer.timestamp, startValue: equalizer.value, startX: equalizer.x };
      }

      return [equalizer, { ...current, x: x }];
    } else {
      // continuation of an existing pour
      if (currentPour == null) {
        currentPour = { startTime: current.timestamp, startValue: current.value, startX: x };
      }

      x += secondsSincePrevious * POUR_SECOND_WIDTH;
      currentPour.endTime = current.timestamp;
      currentPour.endValue = current.value;
      currentPour.endX = x;

      if (i == data.length - 1) {
        // last data point
        if (currentPour != null) {
          pours.push(currentPour);
          currentPour = null;
        }
      }

      return [{ ...current, x: x }];
    }
  });
*/

/*
    <CartesianGrid
        verticalCoordinatesGenerator={(props) => { return pours.map((p) => p.startX + props.offset.left);}}/>
      {pours.map((pour, i) => {
        return (
          <ReferenceArea fill="rgba(0, 0, 0, 1)" key={"pour_" + i} x1={pour.startX} x2={pour.endX}>
            <Label
              fill={color}
              stroke="white"
              strokeWidth={0.75}
              fontWeight={1000}
              position={pour.startValue >= tapEntry.bottlingVolume / 2 ? "insideBottom" : "center"}>
              {Number(pour.startValue - pour.endValue).toFixed(currentVU.digits)}
            </Label>
          </ReferenceArea>
        );
      })}
*/

export default function TapMeasurement({ data, isPaused, tapEntry }) {
  const theme = useTheme();

  // force re-render every few seconds
  const [_, setTick] = React.useState(false);
  useInterval(() => {
    if (!isPaused) {
      setTick((t) => !t);
    }
  }, RENDER_TICK_SECONDS * 1000);

  const [volumeUnit, setVolumeUnit] = React.useState("L");

  const handleVolumeUnitChange = (e) => {
    setVolumeUnit(e.target.value);
  };

  const currentVU = volumeUnits[volumeUnit];
  const compressedData = compressData(equalizeData(convertData(data, currentVU)));
  const pours = derivePours(compressedData);
  const xAxisTicks = deriveXAxisTicks(compressedData);

  // TODO what should be the default value?
  const displayData = compressedData;
  const currentValue = displayData.length > 0 ? displayData[displayData.length - 1].value : NaN;
  const displayValue = 1 / currentValue !== -Infinity && !Number.isNaN(currentValue) ? currentValue : 0;

  const graphWidth = 3000 // displayData.length > 0 ? displayData[displayData.length - 1].x : 100;
  const color = srmToRgb(tapEntry.srm);
  const gridColor= "#393939";
  const tickColor = theme.palette.text.secondary;

  const hex2rgba = (hex, alpha = 1) => {
    const [r, g, b] = hex.match(/\w\w/g).map(x => parseInt(x, 16));
    return `rgba(${r},${g},${b},${alpha})`;
  };

  const chartOptions = {
    animation: false,
    maintainAspectRatio: false,
    responsive: true,
    scales: {
      x: {
        type: "pour",
        alignToPixels: true,
        border: {
          color: gridColor
        },
        grid: {
          color: gridColor
        },
        ticks: {
          color: tickColor
        }
      },
      y: {
        type: "linear",
        alignToPixels: true,
        beginAtZero: true,
        grace: "10%",
        border: {
          color: gridColor
        },
        grid: {
          color: gridColor
        },
        ticks: {
          color: tickColor,
          stepSize: 0.5
        }
      }
    },
    elements: {
      point: {
        radius: 0
      },
      line: {
        tension: .1,
        backgroundColor: hex2rgba(color, .5),
        borderColor: color,
        borderWidth: 3,
        fill: 'origin'
      }
    },
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        enabled: false
      },
      fixedYAxis: {
        canvasId: "chart-fixed-y-axis"
      }
    }
  };

  const fixedYAxis = {
    id: "fixedYAxis",
    afterRender: (chart, _, opts) => {
      const copyWidth = chart.scales.y.width + chart.scales.y.left + 1;
      // the +10 adjusts for the height of the bottom label
      const copyHeight = chart.scales.y.height + chart.scales.y.top + 10;

      const scale = window.devicePixelRatio;
      const canvasWidth = copyWidth * scale;
      const canvasHeight = copyHeight * scale;

      const yAxisCanvas = document.getElementById(opts.canvasId);
      var targetCtx = yAxisCanvas.getContext("2d");
      targetCtx.scale(scale, scale);
      targetCtx.canvas.width = canvasWidth;
      targetCtx.canvas.height = canvasHeight;

      targetCtx.canvas.style.width = `${copyWidth}px`;
      targetCtx.canvas.style.height = `${copyHeight}px`;
      // this color is the same as rgba(255, 255, 255, 0.03) but with alpha=1 on the current backround
      targetCtx.save();
      targetCtx.fillStyle = '#252525';
      targetCtx.fillRect(0, 0, canvasWidth, canvasHeight);
      targetCtx.restore();

      const sourceCanvas = chart.canvas;
      targetCtx.drawImage(sourceCanvas, 0, 0, canvasWidth, canvasHeight, 0, 0, canvasWidth, canvasHeight);

      const sourceCtx = chart.ctx;
      sourceCtx.save();
      sourceCtx.fillStyle = '#252525';
      sourceCtx.fillRect(0, 0, copyWidth, copyHeight);
      sourceCtx.restore();

      const container = yAxisCanvas.parentElement;
      container.scrollTo({ behavior: "instant", left: chart.canvas.width });
    }
  };

  const chartData = {
    labels: displayData.map((x) => x.timestamp),
    datasets: [
      {
        data: displayData.map((x) => x.value),
      },
    ],
  };

  return (
    <>
      <TapEntryProperties entry={tapEntry} sx={{ mx: 1 }}>
        <div style={{flex: '1 0 0'}} />
        <FormControl sx={{ minWidth: "150px" }}>
          <Select size="small" value={volumeUnit} onChange={handleVolumeUnitChange} sx={{ my: 1, ml: 1 }}>
            {Object.keys(volumeUnits).map(unit => {
              return <MenuItem key={ "volume_unit_" + unit } value={unit}>{unit}</MenuItem>;
            })}
          </Select>
        </FormControl>
      </TapEntryProperties>
      <Divider />
      <Box className="chart-frame" sx={{ height: 1, padding: 1, margin: 1 }}>
        <Box className="chart-container">
          <div style={{ width: `${graphWidth}px`, height: "100%" }}>
              <Line options={chartOptions} data={chartData} plugins={[fixedYAxis]} id="chart-canvas" />
          </div>
          <canvas id="chart-fixed-y-axis"></canvas>
        </Box>
        <div className="chart-display-value">
            <Typography
              color={color}
              sx={{ WebkitTextStrokeWidth: 1, WebkitTextStrokeColor: "white" }}
              fontWeight={1000}
              variant="h1"
              component="span">
              {displayValue}
            </Typography>
        </div>
      </Box>
    </>
  );
}
