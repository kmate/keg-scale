import * as React from 'react';
import { measuredUnits } from './units';

import FormControl from '@mui/material/FormControl';
import Grid from '@mui/material/Grid';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import Typography from '@mui/material/Typography';
import DensityInput from './DensityInput';

export default function LiveMeasurement({ value, padding }) {
  const [measuredUnit, setMeasuredUnit] = React.useState("g");
  const [density, setDensity] = React.useState(1000); // always in g/L

  const handleMeasuredUnitChange = (e) => {
    setMeasuredUnit(e.target.value);
  };

  const currentMU = measuredUnits[measuredUnit];
  const densityQuotient = currentMU.isVolumeUnit && density != 0 ? density : 1;
  const convertedValue = Number((value * currentMU.multiplier / densityQuotient).toFixed(currentMU.digits));
  const displayValue = 1 / convertedValue !== -Infinity && !Number.isNaN(convertedValue) ? convertedValue : 0;

  return (
    <Grid
      container
      padding={padding}
      height={1}
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
      {currentMU.isVolumeUnit &&
        <Grid item xs={3} sx={{pt: 3}}>
          <DensityInput value={density} onChange={setDensity} />
        </Grid>}
    </Grid>
  );
}
