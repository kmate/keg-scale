import * as React from 'react';

import LinkIcon from '@mui/icons-material/Link';
import SquareIcon from '@mui/icons-material/Square';
import { IconButton, InputAdornment, TextField, Tooltip } from '@mui/material';
import { Stack } from '@mui/system';
import { DatePicker } from '@mui/x-date-pickers';
import DensityInput from './DensityInput';
import InputWithUnit from './InputWithUnit';
import srmToRgb from './srmToRgb';
import { colorUnits, volumeUnits } from './units';

function AbvInput({ value, onChange }) {
  const [prevValue, setPrevValue] = React.useState();
  const [abvText, setAbvText] = React.useState("5.0");
  const [inputError, setInputError] = React.useState(false);

  const textToValue = (text) => {
    if (!text) {
      return null;
    }

    const parsed = Number(text);
    if (!Number.isNaN(parsed) && parsed >= 0 && parsed < 50) {
      return parsed;
    }

    return null;
  };

  const updateText = (text) => {
    setAbvText(text);

    const parsed = textToValue(text);
    setInputError(parsed == null);
  }

  if (prevValue != value) {
    updateText(Number(value).toFixed(1));
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
      onChange(parsed);
    }
  };

  return (
    <TextField
      sx={{input: {textAlign: "right"}}}
      label="ABV"
      variant="outlined"
      error={inputError}
      value={abvText}
      onChange={handleChange}
      onBlur={handleBlur}
      InputProps={{
        endAdornment: <InputAdornment position="end">% V/V</InputAdornment>
      }} />
  );
}

function ColorInput({ value, onChange }) {
  return (
    <InputWithUnit
      label="Color"
      units={colorUnits}
      unitMinWidth={80}
      defaultUnit="SRM"
      defaultValue="9"
      value={value}
      onChange={onChange}
      isValid={(parsed) => parsed >= 0 && parsed <= 100}
      startAdornment={<SquareIcon sx={{ backgroundColor: "white" }} htmlColor={srmToRgb(value)}></SquareIcon>} />
  );
}

function BottlingSizeInput({ value, onChange }) {
  return (
    <InputWithUnit
      label="Bottling volume"
      units={volumeUnits}
      unitMinWidth={150}
      defaultUnit="L"
      defaultValue="19"
      value={value}
      onChange={onChange}
      isValid={(parsed) => parsed >= 0 && parsed <= 100} />
  );
}

export default function EntryInputPanel({ entry, onEntryChange }) {

  const handleNameChange = (e) => {
    onEntryChange({ ...entry, name: e.target.value });
  };

  const handleAbvChange = (abv) => {
    onEntryChange({ ...entry, abv: abv });
  };

  const handleFinalGravityChange = (fg) => {
    onEntryChange({ ...entry, finalGravity: fg });
  };

  const handleColorChange = (srm) => {
    onEntryChange({ ...entry, srm: srm });
  };

  const handleBottlingSizeChange = (l) => {
    onEntryChange({ ...entry, bottlingSize: l });
  };

  const handleBottlingDateChange = (d) => {
    onEntryChange({ ...entry, bottlingDate: d });
  };

  return (
    <Stack direction="column" paddingTop={2} spacing={2}>
      <TextField
        label="Name"
        variant="outlined"
        fullWidth
        value={entry.name}
        onChange={handleNameChange}
        InputProps={ entry.id && {
          endAdornment:
            <InputAdornment position="end">
              <Tooltip title={"Catalog id: " + entry.id} placement="left">
                <IconButton disableRipple>
                  <LinkIcon fontSize="small" />
                </IconButton>
             </Tooltip>
            </InputAdornment>
        }} />
      <Stack direction="row" spacing={2}>
        <AbvInput
          value={entry.abv}
          onChange={handleAbvChange} />
        <DensityInput
          value={entry.finalGravity}
          onChange={handleFinalGravityChange} />
        <ColorInput
          value={entry.srm}
          onChange={handleColorChange} />
      </Stack>
      <Stack direction="row" spacing={2}>
        <BottlingSizeInput
          value={entry.bottlingSize}
          onChange={handleBottlingSizeChange} />
        <DatePicker
          label="Bottling date"
          variant="outlined"
          value={entry.bottlingDate}
          onChange={handleBottlingDateChange} />
      </Stack>
    </Stack>
  );
}
