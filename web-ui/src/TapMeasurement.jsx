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

const SECONDS_PER_HOUR = 60 * 60;
const SECONDS_PER_DAY = 24 * SECONDS_PER_HOUR;

const HOUR_WIDTH = 30;
const DAY_WIDTH = 50;
const POUR_SECOND_WIDTH = 2;

export default function TapMeasurement({ data, isPaused, tapEntry, padding }) {

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

  let x = 0;
  let currentPour = null;
  let pours = [];

  const currentVU = volumeUnits[volumeUnit];
  const convertedData = Object.keys(data)
    .map((key) => { return {
      timestamp: Number(key) * 1000,
      value: Number((data[key] * currentVU.multiplier).toFixed(currentVU.digits))
    }})
    .sort((a, b) => a.timestamp - b.timestamp)
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

  // TODO what should be the default lenght?
  const graphWidth = convertedData.length > 0 ? convertedData[convertedData.length - 1].x : 100;
  const color = srmToRgb(tapEntry.srm);

  const currentValue = convertedData.length > 0 ? convertedData[convertedData.length - 1].value : NaN;
  const displayValue = 1 / currentValue !== -Infinity && !Number.isNaN(currentValue) ? currentValue : 0;

  // TODO duplicate data points when there was e.g. > ~5sec gap between 2 values,
  // e.g. if [(ts=10s, v=1.0), (ts=17s, v=0.9)], then transform it to
  // [(ts=10s, v=1.0), (ts=16.999s, v=1.0), (ts=17s, v=0.9)] or something similar
  // (this is to make longer unchanged sections completely horizontal)
  // also we could make the X values completely artificial to support this correctly,
  // see also the "collapse" of long unchanged sections below.

  const displayData = [ ...convertedData ];
  if (convertedData.length > 0) {
    displayData.push({ timestamp: new Date().getTime(), value: currentValue });
  }

  // TODO make the chart horizontally scrollable and scroll to the end by default
  // TODO apply a "maximum distance" between timestamps to make sure you don't have to scroll thorugh a week forever
  //  also we could use a drag-scroll container to make it easier to use
  //  min-width could be 100% to fill the view anyways then, and calculate the "real width" based on virtual the X coordinates
  // TODO add markers of pours and add stats about pours, e.g. number of them and avg volume
  // TODO a pour could be defined by value changes close to each other i.e. in a few seconds
  // TODO overlay the remaining volume number with the chart?
  //  where to put the unit selector then? maybe the same row as the ABV, FG, etc.?
  // TODO add smaller crosshairs ever 1 / 0.5 dl?
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
      <Stack direction="row" padding={padding}>
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
        <ScrollContainer className="graph-scroll-container">
          <AreaChart width={graphWidth} height={300}>
            <defs>
              <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={color} stopOpacity={0.8}/>
                <stop offset="95%" stopColor={color} stopOpacity={0}/>
              </linearGradient>
            </defs>
            <XAxis
              dataKey="x"
              domain={["dataMin", "dataMax"]}
              type="number" />
            <YAxis
              dataKey="value"
              min={0}
              label={{ value: "Remaining volume", angle: -90, position: "insideLeft" }} />
            <CartesianGrid
              verticalCoordinatesGenerator={(props) => { console.log(props); return pours.map((p) => p.startX + props.offset.left);}}/>
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
