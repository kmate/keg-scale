import * as React from 'react';
import useInterval from 'use-interval'
import { useTheme } from '@mui/material/styles';

import { Typography } from "@mui/material";
import { Box } from "@mui/system";

import dayjs from 'dayjs';
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
import PourScale, { POUR_GAP_SECONDS } from './PourScale';
import srmToRgb from './srmToRgb';
import { volumeUnits } from './units';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PourScale,
  PointElement,
  LineElement,
  Tooltip,
  Filler
);

const RENDER_TICK_SECONDS = 5;

function convertData(rawData, volumeUnit) {
  return Object.keys(rawData)
    .map((key) => { return {
      timestamp: dayjs.unix(Number(key)),
      value: Number((rawData[key] * volumeUnit.multiplier).toFixed(volumeUnit.digits))
    }})
    .sort((a, b) => +a.timestamp - +b.timestamp);
}

function equalizeData(convertedData, bottlingDate) {
  const equalizedData = convertedData.flatMap((current, i, data) => {
    if (i == 0) {
      // first data point, no equalizer
      return [current];
    }

    const previous = data[i - 1];
    const secondsSincePrevious = current.timestamp.diff(previous.timestamp, "second");
    if (secondsSincePrevious > POUR_GAP_SECONDS) {
      // new pour, equalizer should be added
      let equalizerShiftSeconds = 1;
      if (i + 1 < data.length) {
        const next = data[i + 1];
        equalizerShiftSeconds = next.timestamp.diff(current.timestamp, "second");
      }
      const equalizer = { timestamp: current.timestamp.subtract(equalizerShiftSeconds, "second"), value: previous.value };
      return [equalizer, current];
    } else {
      // continuation of an existing pour
      return [current];
    }
  });

  if (equalizedData.length > 0) {
    // change the date of the first data point to be the bottling date
    if (bottlingDate) {
      equalizedData[0].timestamp = dayjs(bottlingDate);
    }

    // add data point for "now"
    equalizedData.push({ timestamp: dayjs(), value: equalizedData[equalizedData.length - 1].value });
  }

  return equalizedData;
}

export default function TapChart({ data, isPaused, tapEntry, volumeUnit, height, backroundColor }) {
  const theme = useTheme();

  // force re-render every few seconds
  const [_, setTick] = React.useState(false);
  useInterval(() => {
    const chartContainer = document.getElementsByClassName("chart-container")[0];
    const scrolledToEnd = chartContainer
      ? chartContainer.scrollLeft == chartContainer.scrollWidth - chartContainer.clientWidth
      : true;

    if (!isPaused && scrolledToEnd) {
      setTick((t) => !t);
    }
  }, RENDER_TICK_SECONDS * 1000);

  const [graphWidth, setGraphWidth] = React.useState(100);

  const currentVU = volumeUnits[volumeUnit];
  const displayData = equalizeData(convertData(data, currentVU), tapEntry.bottlingDate);
  const currentValue = displayData.length > 0 ? displayData[displayData.length - 1].value : NaN;
  const displayValue = 1 / currentValue !== -Infinity && !Number.isNaN(currentValue) ? currentValue : 0;

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
          autoSkip: false,
          color: tickColor,
          digits: currentVU.digits,
          font: {
            family: theme.typography.fontFamily,
            size: theme.typography.fontSize
          },
          maxRotation: 0,
          pourColor: color
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
          font: {
            family: theme.typography.fontFamily,
            size: theme.typography.fontSize
          },
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
      // the +1 adjusts for the border line of the axis
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
      targetCtx.save();
      targetCtx.fillStyle = backroundColor;
      targetCtx.fillRect(0, 0, canvasWidth, canvasHeight);
      targetCtx.restore();

      const sourceCanvas = chart.canvas;
      targetCtx.drawImage(sourceCanvas, 0, 0, canvasWidth, canvasHeight, 0, 0, canvasWidth, canvasHeight);

      const sourceCtx = chart.ctx;
      sourceCtx.save();
      sourceCtx.fillStyle = backroundColor;
      sourceCtx.fillRect(0, 0, copyWidth, copyHeight);
      sourceCtx.restore();

      const container = yAxisCanvas.parentElement;
      container.scrollTo({ behavior: "instant", left: chart.canvas.width });
    }
  };

  const pourScaleBasedWidth = {
    id: "pourScaleBasedWidth",
    afterBuildTicks: (chart) => {
      const scale = chart.scales.x;
      if (scale.ticks.length > 0) {
        const newWidth = Math.ceil(scale._startPixel + scale.ticks[scale.ticks.length - 1].x + 60);
        if (newWidth > graphWidth) {
          setGraphWidth(newWidth);
        }
      }
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
    <Box className="chart-frame" sx={{ height: height ? height : 1, padding: 1, margin: 1 }}>
      <Box className="chart-container">
        <div style={{ width: `${graphWidth}px`, height: "100%" }}>
            <Line options={chartOptions} data={chartData} plugins={[fixedYAxis, pourScaleBasedWidth]} id="chart-canvas" />
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
  );
}
