import * as React from 'react';

import InputAdornment from '@mui/material/InputAdornment';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import TextField from '@mui/material/TextField';
import useLocalStorage from './useLocalStorage';

export default function InputWithUnit({ label, units, defaultUnit, value, defaultValue, onChange, onError, isValid, startAdornment, ...props }) {
  const [prevValue, setPrevValue] = React.useState();
  const [unit, setUnit] = useLocalStorage("inputWithUnit_" + label.replace(/\s/g, "_").toLowerCase(), defaultUnit);
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
    const hasError = parsed == null;
    setInputError(hasError);
    if (onError) {
      onError(hasError ? "invalid" : null);
    }
  }

  React.useEffect(() => {
    if (prevValue != value) {
      updateText(valueToText(value, unit));
      setPrevValue(value);
    }
  }, [value]);

  const handleChange = (e) => {
    const text = e.target.value;
    updateText(text);
  }

  const handleBlur = (e) => {
    const text = e.target.value;
    const parsed = textToValue(text);
    if (parsed != null) {
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
      }}
      {...props} />
  );
}
