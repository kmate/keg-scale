import * as React from 'react';
import useInterval from 'use-interval'

import { Divider, FormControl, MenuItem, Paper, Select, Typography } from '@mui/material';
import { Stack } from '@mui/system';
import { volumeUnits } from './units';
import { Area, AreaChart, CartesianGrid, Label, ReferenceArea, Tooltip, XAxis, YAxis } from 'recharts';
import TapEntryProperties from './TapEntryProperties';
import srmToRgb from './srmToRgb';

import { ScrollContainer } from 'react-indiana-drag-scroll';
import 'react-indiana-drag-scroll/dist/style.css'
import { purple } from '@mui/material/colors';

const RENDER_TICK_SECONDS = 10;

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
  return equalizedData;
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

export default function TapMeasurement({ data, isPaused, tapEntry }) {

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

  // TODO what should be the default lenght?
  const displayData = compressedData;
  const currentValue = displayData.length > 0 ? displayData[displayData.length - 1].value : NaN;
  const displayValue = 1 / currentValue !== -Infinity && !Number.isNaN(currentValue) ? currentValue : 0;

  const graphWidth = 3000 // displayData.length > 0 ? displayData[displayData.length - 1].x : 100;
  const color = srmToRgb(tapEntry.srm);

  // this is an extremely hacky way to put the Y axis outside the chart,
  // hence "freeze it" against horizontal scrolling of the rest of the chart
  React.useEffect(() => {
    const yAxisWrapper = document.getElementById("chart-yAxisWrapper");
    if (!yAxisWrapper) {
      return;
    }
    const yAxisCandidates = document.getElementsByClassName("recharts-yAxis");
    if (yAxisCandidates.length != 1) {
      return;
    }
    const yAxis = yAxisCandidates[0];
    const yAxisWidth = yAxis.getClientRects()[0].width;

    yAxis.remove();
    yAxisWrapper.appendChild(yAxis);
    yAxisWrapper.style.flexBasis = yAxisWidth + "px";

    const chartCandidates = document.getElementsByClassName("recharts-surface");
    if (chartCandidates.length != 1) {
      return;
    }
    const chart = chartCandidates[0];

    chart.viewBox.baseVal.width -= yAxisWidth;
    chart.viewBox.baseVal.x = yAxisWidth;
    const newChartWidth = (chart.width.baseVal.value - yAxisWidth) + "px";
    chart.setAttribute("width", newChartWidth);

    const chartWrapper = chart.parentElement;
    chartWrapper.style.width = newChartWidth;
  }, [data, isPaused, tapEntry]);

  // TODO make the chart horizontally scrollable and scroll to the end by default
  // TODO apply a "maximum distance" between timestamps to make sure you don't have to scroll thorugh a week forever
  //  also we could use a drag-scroll container to make it easier to use
  //  min-width could be 100% to fill the view anyways then, and calculate the "real width" based on virtual the X coordinates
  // TODO add markers of pours and add stats about pours, e.g. number of them and avg volume
  // TODO a pour could be defined by value changes close to each other i.e. in a few seconds
  // TODO overlay the remaining volume number with the chart?
  //  where to put the unit selector then? maybe the same row as the ABV, FG, etc.?
  // TODO add smaller crosshairs ever 1 / 0.5 dl?

/*
        <Stack direction="column" alignItems="center">
          <Typography
            color={color}
            sx={{ WebkitTextStrokeWidth: 1, WebkitTextStrokeColor: "white" }}
            fontWeight={1000}
            variant="h1"
            component="span"
            ml={1}
            mr={1}>
            {displayValue}
          </Typography>
        </Stack>
*/

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
      <Stack direction="row" margin={1} className="chart-container">
        <svg id="chart-yAxisWrapper" height={300}>
        </svg>
        <ScrollContainer vertical="false" className="chart-scroll-container">
          <AreaChart width={graphWidth} height={300}>
            <defs>
              <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={color} stopOpacity={0.8}/>
                <stop offset="95%" stopColor={color} stopOpacity={0}/>
              </linearGradient>
            </defs>
            <XAxis
              dataKey="timestamp"
              domain={["dataMin", "dataMax"]}
              type="number" />
            <YAxis
              dataKey="value"
              min={0}>
              <Label angle={-90} position="insideLeft" style={{ textAnchor: "middle" }}>Remaining volume</Label>
            </YAxis>
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
            <Area
              data={displayData}
              type="monotone"
              dataKey="value"
              strokeWidth={3}
              stroke={color}
              fillOpacity={1}
              fill="url(#colorGradient)" />
            <Tooltip />
          </AreaChart>
        </ScrollContainer>
      </Stack>
    </>
  );
}
