import * as React from 'react';

import { FormControl, Grid, MenuItem, Select, TextField, Typography } from '@mui/material';

const measuredUnits = {
  g: {
    multiplier: 1, // g is the default mass unit
    digits: 0,
    isVolumeUnit: false
  },
  kg: {
    multiplier: 1/1000,
    digits: 2,
    isVolumeUnit: false
  },
  lb: {
    multiplier: 1/453.59237,
    digits: 2,
    isVolumeUnit: false
  },
  dl: {
    multiplier: 10,
    digits: 1,
    isVolumeUnit: true
  },
  l: {
    multiplier: 1, // L is the default volume unit
    digits: 2,
    isVolumeUnit: true
  },
  "US fl oz": {
    multiplier: 1/0.0295735296,
    digits: 1,
    isVolumeUnit: true
  },
  "UK fl oz": {
    multiplier: 1/0.02841306,
    digits: 1,
    isVolumeUnit: true
  },
  "US gallon": {
    multiplier: 1/3.785411784,
    digits: 1,
    isVolumeUnit: true
  },
  "UK gallon": {
    multiplier: 1/4.54609,
    digits: 1,
    isVolumeUnit: true
  }
}

const densityUnits = {
  "g/L": {
    from: (d) => d,
    to: (d) => d,
    digits: 0
  },
  "SG points": {
    from: (d) => d - 1000,
    to: (d) => d + 1000,
    digits: 0
  },
  "°P": {
    from: (d) => 259 - (259 / (d / 1000)),
    to: (d) => 259 / (259 - d) * 1000,
    digits: 1
  }
}

export default function LiveMeasurement(props) {
  const [measuredUnit, setMeasuredUnit] = React.useState("g");
  const [density, setDensity] = React.useState(1000);
  const [densityUnit, setDensityUnit] = React.useState("g/L");

  const handleMeasuredUnitChange = (e) => {
    setMeasuredUnit(e.target.value);
  };

  const handleDensityChange = (e) => {
    const text = e.target.value;
    if (text != "") {
      const parsed = Number.parseFloat(text);
      if (!Number.isNaN(parsed) && parsed > 0) {
        setDensity(parsed);
      }
    } else {
      setDensity(0);
    }
  }

  const handleDensityUnitChange = (e) => {
    const newUnit = e.target.value;
    const densityInGperL = densityUnits[densityUnit].to(density);
    const densityInNewUnit = densityUnits[newUnit].from(densityInGperL);
    const roundedDensity = Number.parseFloat(densityInNewUnit.toFixed(densityUnits[newUnit].digits));
    setDensity(roundedDensity);
    setDensityUnit(newUnit);
  };

  const currentMU = measuredUnits[measuredUnit];
  const currentDU = densityUnits[densityUnit];
  const densityQuotient = currentMU.isVolumeUnit ? currentDU.to(density) : 1;
  const convertedValue = (props.value * currentMU.multiplier / densityQuotient).toFixed(currentMU.digits);
  const displayValue = 1 / convertedValue !== -Infinity ? convertedValue : 0;

  return (
    <Grid
      container
      padding={props.padding}
      direction="column"
      alignItems="center"
      justifyContent="center">
      <Grid item xs={3}>
        <Typography variant="h3" component="span" ml={1} mr={1}>{displayValue}</Typography>
        <FormControl sx={{ minWidth: "80px" }}>
          <Select value={measuredUnit} onChange={handleMeasuredUnitChange}>
            {Object.keys(measuredUnits).map(unit => {
              return <MenuItem key={ "measured_unit_" + unit } value={unit}>{unit}</MenuItem>;
            })}
          </Select>
        </FormControl>
      </Grid>
      {currentMU.isVolumeUnit && (
        <Grid item xs={3} sx={{pt: 3}}>
          <TextField
            sx={{input: {textAlign: 'right'}}}
            label="Density"
            variant="outlined"
            value={density}
            onChange={handleDensityChange} />
          <FormControl sx={{ minWidth: "80px", ml: 1 }}>
            <Select value={densityUnit} onChange={handleDensityUnitChange}>
              {Object.keys(densityUnits).map(unit => {
                return <MenuItem key={ "density_unit_" + unit } value={unit}>{unit}</MenuItem>;
              })}
            </Select>
          </FormControl>
        </Grid>
      )}
    </Grid>
  );
}
