import * as React from 'react';

import { FormControl, Grid, MenuItem, Select, TextField, Typography } from '@mui/material';

const measuredUnits = {
  g: {
    multiplier: 1,
    digits: 0,
    isVolumeUnit: false
  },
  kg: {
    multiplier: 1/1000,
    digits: 2,
    isVolumeUnit: false
  },
  dl: {
    multiplier: 10, // g/L is the default
    digits: 1,
    isVolumeUnit: true
  },
  l: {
    multiplier: 1, // g/L is the default
    digits: 2,
    isVolumeUnit: true
  },
  // TODO add lbs, oz, uk/us galon and other units
}

const densityUnits = {
  "g/L": {
    converter: (d) => d
  },
  // TODO add Plato, Brix and other density units
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
    setDensityUnit(e.target.value);
    // TODO set density based on conversion
  };

  const currentMU = measuredUnits[measuredUnit];
  const currentDU = densityUnits[densityUnit];
  const densityQuotient = currentMU.isVolumeUnit && density > 0 ? currentDU.converter(density) : 1;
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
