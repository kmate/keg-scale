import * as React from 'react';

import { InputAdornment, MenuItem, Select, TextField } from '@mui/material';

export default function InputWithUnit({ label, units, defaultUnit, value, defaultValue, onChange, isValid, startAdornment }) {
  const [prevValue, setPrevValue] = React.useState();
  const [unit, setUnit] = React.useState(defaultUnit);
  const [text, setText] = React.useState(defaultValue);
  const [inputError, setInputError] = React.useState(false);

  const toDefaultUnit = (value) => {
    const u = units[unit];
    return Number((u.to ? u.to(value) : (value / u.multiplier)));
  };

  const valueToText = (valueInDefaultUnit, unit) => {
    const u = units[unit];
    const valueInNewUnit = u.from ? u.from(valueInDefaultUnit) : (valueInDefaultUnit * u.multiplier);
    return valueInNewUnit.toFixed(u.digits);
  };

  const textToValue = (text) => {
    if (!text) {
      return null;
    }

    const parsed = Number(text);
    if (Number.isNaN(parsed)) {
      return null;
    }

    const value = toDefaultUnit(parsed);
    if(!isValid(value)) {
      return null;
    }

    return parsed;
  };

  const updateText = (text) => {
    setText(text);

    const parsed = textToValue(text);
    setInputError(!parsed);
  }

  if (prevValue != value) {
    updateText(valueToText(value, unit));
    setPrevValue(value);
  }

  const handleChange = (e) => {
    const text = e.target.value;
    updateText(text);
  }

  const handleBlur = (e) => {
    const text = e.target.value;
    const parsed = textToValue(text);
    if (!!parsed) {
      onChange(toDefaultUnit(parsed));
    }
  };

  const handleUnitChange = (e) => {
    const newUnit = e.target.value;
    const value = textToValue(text);
    const valueInDefaultUnit = toDefaultUnit(value);
    const roundedValue = valueToText(valueInDefaultUnit, newUnit);

    setText(roundedValue);
    setUnit(newUnit);
  };

  return (
    <TextField
      sx={{input: {textAlign: "right"}}}
      label={label}
      variant="outlined"
      error={inputError}
      value={text}
      onChange={handleChange}
      onBlur={handleBlur}
      InputProps={{
        startAdornment: <InputAdornment position="start">{startAdornment}</InputAdornment>,
        endAdornment:
          <InputAdornment position="end">
            <Select variant="outlined" size="small" readOnly={inputError} value={unit} onChange={handleUnitChange}>
              {Object.keys(units).map(unit => {
                return <MenuItem key={ "unit_" + unit } value={unit}>{unit}</MenuItem>;
              })}
            </Select>
          </InputAdornment>
      }}/>
  );
}
