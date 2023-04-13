import * as React from 'react';
import dayjs from 'dayjs';

import SquareIcon from '@mui/icons-material/Square';
import { InputAdornment, TextField } from '@mui/material';
import { Stack } from '@mui/system';
import { DatePicker } from '@mui/x-date-pickers';
import DensityInput from './DensityInput';
import InputWithUnit from './InputWithUnit';
import srmToRgb from './srmToRgb';
import { colorUnits, volumeUnits } from './units';

function AbvInput({ value, onChange }) {
  const [abvText, setAbvText] = React.useState(value ? Number(value).toFixed(1) : "5.0");
  const [inputError, setInputError] = React.useState(false);

  const handleAbvChange = (e) => {
    const text = e.target.value;
    setAbvText(text);

    if (text != "") {
      const parsed = Number(text);
      if (!Number.isNaN(parsed) && parsed >= 0 && parsed < 50) {
        setInputError(false);
        onChange(parsed);
      } else {
        setInputError(true);
      }
    } else {
      setInputError(true);
    }
  }

  return (
    <TextField
      sx={{input: {textAlign: "right"}}}
      label="ABV"
      variant="outlined"
      error={inputError}
      value={abvText}
      onChange={handleAbvChange}
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
      InputProps={{
        endAdornment:
          <InputAdornment position="end">
            <SquareIcon sx={{ backgroundColor: "white" }} htmlColor={srmToRgb(value)}></SquareIcon>
          </InputAdornment>
      }}/>
  );
}

function BottlingSizeInput({ value, onChange }) {
  return (
    <InputWithUnit
      label="Bottling volume"
      units={volumeUnits}
      unitMinWidth={150}
      defaultUnit="l"
      defaultValue="19"
      value={value}
      onChange={onChange}
      isValid={(parsed) => parsed >= 0 && parsed <= 100} />
  );
}

export default function EntryInputPanel({ entry, onEntryChange }) {

  const handleNameChange = (e) => {
    entry.name = e.target.value;
    onEntryChange(entry);
  };

  const handleAbvChange = (abv) => {
    entry.abv = abv;
    onEntryChange(entry);
  };

  const handleFinalGravityChange = (fg) => {
    entry.finalGravity = fg;
    onEntryChange(entry);
  };

  const handleColorChange = (srm) => {
    entry.srm = srm;
    onEntryChange(entry);
  };

  const handleBottlingSizeChange = (l) => {
    entry.bottlingSize = l;
    onEntryChange(entry);
  };

  const handleBottlingDateChange = (e) => {
    console.log("bottling date change!", e);
  };

  return (
    <Stack direction="column" paddingTop={2} spacing={2}>
      <Stack direction="row" spacing={2}>
        {entry.id && <TextField label="Catalog id" value={entry.id} disabled={true} sx={{ minWidth: 200 }} />}
        <TextField
          label="Name"
          variant="outlined"
          fullWidth={true}
          value={entry.name}
          onChange={handleNameChange} />
      </Stack>
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
