import * as React from 'react';
import { densityUnits } from './units';
import { FormControl, Grid, MenuItem, Select, TextField } from '@mui/material';

export default function DensityInput({ value, onChange }) {
  const densityTextToValue = (text) => {
    const du = densityUnits[densityUnit];
    return Number(du.to(Number(text)).toFixed(du.digits));
  };

  const [densityUnit, setDensityUnit] = React.useState("g/L");
  const [densityText, setDensityText] = React.useState(value ? densityTextToValue(value.toString()) : "1000");
  const [inputError, setInputError] = React.useState(false);

  const handleDensityChange = (e) => {
    const text = e.target.value;
    setDensityText(text);

    if (text != "") {
      const parsed = Number(text);
      if (!Number.isNaN(parsed)) {
        setInputError(false);

        const densityInGperL = densityTextToValue(text);
        onChange(densityInGperL);
      } else {
        setInputError(true);
      }
    } else {
      setInputError(true);
    }
  };

  const handleDensityUnitChange = (e) => {
    const newUnit = e.target.value;
    const densityInGperL = densityTextToValue(densityText);
    const densityInNewUnit = densityUnits[newUnit].from(densityInGperL);
    const roundedDensity = densityInNewUnit.toFixed(densityUnits[newUnit].digits);

    setDensityText(roundedDensity);
    setDensityUnit(newUnit);

    onChange(densityInGperL);
  };

  return (
    <Grid item xs={3} sx={{pt: 3}}>
      <TextField
        sx={{input: {textAlign: 'right'}}}
        label="Density"
        variant="outlined"
        error={inputError}
        value={densityText}
        onChange={handleDensityChange} />
      <FormControl sx={{ minWidth: "120px", ml: 1 }}>
        <Select readOnly={inputError} value={densityUnit} onChange={handleDensityUnitChange}>
          {Object.keys(densityUnits).map(unit => {
            return <MenuItem key={ "density_unit_" + unit } value={unit}>{unit}</MenuItem>;
          })}
        </Select>
      </FormControl>
    </Grid>
  );
}
