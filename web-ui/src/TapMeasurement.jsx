import * as React from 'react';
import useInterval from 'use-interval'
import { useTheme } from '@mui/material/styles';

import { Box, Divider, FormControl, MenuItem, Select, Typography } from '@mui/material';
import { volumeUnits } from './units';
import TapEntryProperties from './TapEntryProperties';
import srmToRgb from './srmToRgb';

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

function convertData(rawData, volumeUnit) {
  return Object.keys(rawData)
    .map((key) => { return {
      timestamp: dayjs.unix(Number(key)),
      value: Number((rawData[key] * volumeUnit.multiplier).toFixed(volumeUnit.digits))
    }})
    .sort((a, b) => +a.timestamp - +b.timestamp);
}

function equalizeData(convertedData) {
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
    equalizedData.push({ timestamp: dayjs(), value: equalizedData[equalizedData.length - 1].value });
  }

  return equalizedData;
}

/*
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

  const [graphWidth, setGraphWidth] = React.useState(100);

  const currentVU = volumeUnits[volumeUnit];
  const displayData = equalizeData(convertData(data, currentVU));
  const currentValue = displayData.length > 0 ? displayData[displayData.length - 1].value : NaN;
  const displayValue = 1 / currentValue !== -Infinity && !Number.isNaN(currentValue) ? currentValue : 0;

  const color = srmToRgb(tapEntry.srm);
  // this color is the same as rgba(255, 255, 255, 0.03) but with alpha=1 on the current backround
  const backroundColor = "#252525";
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
        const newWidth = Math.ceil(scale._startPixel + scale.ticks[scale.ticks.length - 1].x + 100);
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
    </>
  );
}
