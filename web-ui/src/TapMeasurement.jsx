import * as React from 'react';
import useInterval from 'use-interval'

import { FormControl, MenuItem, Select, Typography } from '@mui/material';
import { Stack } from '@mui/system';
import { volumeUnits } from './units';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, XAxis, YAxis } from 'recharts';

const RENDER_TICK_SECONDS = 10;

export default function TapMeasurement({ data, isPaused, color, padding }) {

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
  const convertedData = Object.keys(data)
    .map((key) => { return {
      timestamp: Number(key) * 1000,
      value: Number((data[key] * currentVU.multiplier).toFixed(currentVU.digits))
    }; })
    .sort((a, b) => a.timestamp - b.timestamp);

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
        <FormControl sx={{ minWidth: "80px" }}>
            <Select value={volumeUnit} onChange={handleVolumeUnitChange}>
              {Object.keys(volumeUnits).map(unit => {
                return <MenuItem key={ "volume_unit_" + unit } value={unit}>{unit}</MenuItem>;
              })}
            </Select>
        </FormControl>
      </Stack>
      <ResponsiveContainer width="100%" height={300}>
        <AreaChart>
        <defs>
          <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={color} stopOpacity={0.8}/>
            <stop offset="95%" stopColor={color} stopOpacity={0}/>
          </linearGradient>
        </defs>
          <XAxis
            dataKey="timestamp"
            domain={["dataMin", "dataMax"]}
            name="Time"
            tickFormatter={unixTime => ""}
            type="number" />
          <YAxis dataKey="value" name="Value" min={0} />
          <CartesianGrid />
          <Area
            data={displayData}
            type="monotoneX"
            dataKey="value"
            strokeWidth={3}
            stroke={color}
            fillOpacity={1}
            fill="url(#colorGradient)" />
        </AreaChart>
      </ResponsiveContainer>
    </Stack>
  );
}
