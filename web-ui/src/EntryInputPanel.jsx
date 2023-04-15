import * as React from 'react';

import LinkIcon from '@mui/icons-material/Link';
import SquareIcon from '@mui/icons-material/Square';
import { FormControlLabel, IconButton, InputAdornment, Switch, TextField, Tooltip, Typography } from '@mui/material';
import { Stack } from '@mui/system';
import { DatePicker } from '@mui/x-date-pickers';
import DensityInput from './DensityInput';
import InputWithUnit from './InputWithUnit';
import KnownWeights from './KnownWeights';
import srmToRgb from './srmToRgb';
import { colorUnits, volumeUnits } from './units';

function BatchNameInput({ id, value, onChange, ...props }) {
  const [prevValue, setPrevValue] = React.useState();
  const [text, setText] = React.useState("");
  const [inputError, setInputError] = React.useState(false);

  function isValid(text) {
    return text != null && text.replace(/\s/g, "").length > 0;
  };

  const updateText = (text) => {
    setText(text);
    setInputError(!isValid(text));
  }

  if (prevValue != value) {
    updateText(value);
    setPrevValue(value);
  }

  const handleChange = (e) => {
    const text = e.target.value;
    updateText(text);
  }

  const handleBlur = (e) => {
    const text = e.target.value;
    if (isValid(text)) {
      onChange(text);
    }
  };

  return (
    <TextField
    label="Name"
    variant="outlined"
    error={inputError}
    value={text}
    onChange={handleChange}
    onBlur={handleBlur}
    InputProps={ id && {
      endAdornment:
        <InputAdornment position="end">
          <Tooltip title={"Catalog id: " + id} placement="left">
            <IconButton disableRipple>
              <LinkIcon fontSize="small" />
            </IconButton>
        </Tooltip>
        </InputAdornment>
    }}
    {...props} />
  );
}

function AbvInput({ value, onChange, ...props }) {
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
    if (parsed != null) {
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
      }}
      {...props} />
  );
}

function ColorInput({ value, onChange, ...props }) {
  return (
    <InputWithUnit
      label="Color"
      units={colorUnits}
      defaultUnit="SRM"
      defaultValue="9"
      value={value}
      onChange={onChange}
      isValid={(parsed) => parsed >= 0 && parsed <= 100}
      startAdornment={<SquareIcon sx={{ backgroundColor: "white" }} htmlColor={srmToRgb(value)}></SquareIcon>}
      {...props} />
  );
}

function BottlingSizeInput({ value, onChange, ...props }) {
  return (
    <InputWithUnit
      label="Bottling volume"
      units={volumeUnits}
      defaultUnit="L"
      defaultValue="19"
      value={value}
      onChange={onChange}
      isValid={(parsed) => parsed >= 0 && parsed <= 100}
      {...props} />
  );
}

export default function EntryInputPanel({ weights, entry, onEntryChange }) {

  const [useBottlingVolume, setUseBottlingVolume] = React.useState(false);

  const handleNameChange = (name) => {
    onEntryChange({ ...entry, name: name });
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

  const handleKnownWeight = (mass) => {
    if (useBottlingVolume) {
      setEntry({ ...entry, tareOffset: mass });
    }
  }

  const handleUseBottlingVolumeChange = (e) => {
    const newUseBottlingVolume = e.currentTarget.checked;
    setUseBottlingVolume(newUseBottlingVolume);
    // TODO set some prop on entry
  };

  return (
    <Stack direction="column" paddingTop={2} spacing={2}>
      <BatchNameInput
        id={entry.id}
        value={entry.name}
        onChange={handleNameChange}
        fullWidth />
      <Stack direction="row" spacing={2}>
        <AbvInput
          value={entry.abv}
          onChange={handleAbvChange}
          fullWidth />
        <DensityInput
          value={entry.finalGravity}
          onChange={handleFinalGravityChange}
          fullWidth />
        <ColorInput
          value={entry.srm}
          onChange={handleColorChange}
          fullWidth />
      </Stack>
      <Stack direction="row" spacing={2}>
        <DatePicker
          label="Bottling date"
          variant="outlined"
          value={entry.bottlingDate}
          onChange={handleBottlingDateChange}
          sx={{width:"100%"}} />
        <BottlingSizeInput
          value={entry.bottlingSize}
          onChange={handleBottlingSizeChange}
          fullWidth />
        <FormControlLabel control={
          <Switch checked={useBottlingVolume} onChange={handleUseBottlingVolumeChange} />
        } label="Use for measurement" sx={{width:"100%"}} />
      </Stack>
      {!useBottlingVolume &&
        <Stack direction="row" spacing={2} alignItems="center">
          <Typography>Tare offset:</Typography>
          <KnownWeights forTare isToggle selectFirst weights={weights} onClick={handleKnownWeight} />
        </Stack>}
    </Stack>
  );
}
