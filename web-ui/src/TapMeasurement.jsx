import { FormControl, MenuItem, Select, Typography } from '@mui/material';
import { Stack } from '@mui/system';
import * as React from 'react';
import { volumeUnits } from './units';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, XAxis, YAxis } from 'recharts';

export default function TapMeasurement({ data, color, padding }) {
  const [volumeUnit, setVolumeUnit] = React.useState("L");

  const handleVolumeUnitChange = (e) => {
    setVolumeUnit(e.target.value);
  };

  const currentVU = volumeUnits[volumeUnit];
  const convertedData = Object.keys(data)
    .map((key) => { return {
      timestamp: new Date(key.replace(" ", "T") + "Z").getTime(),
      value: Number((data[key] * currentVU.multiplier).toFixed(currentVU.digits))
    }; })
    .sort((a, b) => a.time - b.time);

  const currentValue = convertedData[convertedData.length - 1].value;
  const displayValue = 1 / currentValue !== -Infinity && !Number.isNaN(currentValue) ? currentValue : 0;

  const displayData = [ ...convertedData, { timestamp: new Date().getTime(), value: currentValue } ];

    console.log(displayData);

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
            domain={["auto", "auto"]}
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
