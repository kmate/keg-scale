import * as React from 'react';

import { FormControl, MenuItem, Select, Stack, TextField } from '@mui/material';

export default function InputWithUnit({ label, units, unitMinWidth, defaultUnit, value, defaultValue, onChange, isValid, InputProps }) {
  const textToValue = (text) => {
    const u = units[unit];
    const parsed = Number(text);
    return Number(u.to ? u.to(parsed) : (parsed / u.multiplier)).toFixed(u.digits);
  };

  const [unit, setUnit] = React.useState(defaultUnit);
  const [text, setText] = React.useState(textToValue((value ? value : defaultValue).toString()));
  const [inputError, setInputError] = React.useState(false);

  const handleChange = (e) => {
    const text = e.target.value;
    setText(text);

    if (text != "") {
      const parsed = Number(text);
      if (!Number.isNaN(parsed) && isValid(parsed)) {
        setInputError(false);

        const valueInDefaultUnit = textToValue(text);
        onChange(valueInDefaultUnit);
      } else {
        setInputError(true);
      }
    } else {
      setInputError(true);
    }
  };

  const handleUnitChange = (e) => {
    const newUnit = e.target.value;
    const valueInDefaultUnit = textToValue(text);
    const u = units[newUnit];
    const valueInNewUnit = u.from ? u.from(valueInDefaultUnit) : (valueInDefaultUnit * u.multiplier);
    const roundedValue = valueInNewUnit.toFixed(u.digits);

    setText(roundedValue);
    setUnit(newUnit);

    onChange(valueInDefaultUnit);
  };

  return (
    <Stack direction="row">
      <TextField
        sx={{input: {textAlign: "right"}}}
        label={label}
        variant="outlined"
        error={inputError}
        value={text}
        onChange={handleChange}
        InputProps={InputProps}/>
      <FormControl sx={{ minWidth: unitMinWidth, ml: 1 }}>
        <Select readOnly={inputError} value={unit} onChange={handleUnitChange}>
          {Object.keys(units).map(unit => {
            return <MenuItem key={ "unit_" + unit } value={unit}>{unit}</MenuItem>;
          })}
        </Select>
      </FormControl>
    </Stack>
  );
}
