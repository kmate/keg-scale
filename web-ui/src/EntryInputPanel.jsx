import * as React from 'react';

import LinkIcon from '@mui/icons-material/Link';
import SquareIcon from '@mui/icons-material/Square';
import { FormControlLabel, Grid, IconButton, InputAdornment, Switch, TextField, Tooltip, Typography } from '@mui/material';
import { Stack } from '@mui/system';
import { DatePicker } from '@mui/x-date-pickers';
import DensityInput from './DensityInput';
import InputWithUnit from './InputWithUnit';
import KnownWeights from './KnownWeights';
import srmToRgb from './srmToRgb';
import { colorUnits, volumeUnits } from './units';

function BatchNameInput({ id, number, value, onChange, onError, ...props }) {
  const [prevValue, setPrevValue] = React.useState();
  const [text, setText] = React.useState("");
  const [inputError, setInputError] = React.useState(false);

  function isValid(text) {
    return text != null && text.replace(/\s/g, "").length > 0;
  };

  const updateText = (text) => {
    setText(text);
    const hasError = !isValid(text);
    setInputError(hasError);
    onError(hasError ? "invalid" : null);
  }

  React.useEffect(() => {
    if (prevValue != value) {
      updateText(value);
      setPrevValue(value);
    }
  }, [value]);

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
    InputProps={ id && number && {
      endAdornment:
        <InputAdornment position="end">
          #{number}
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

function AbvInput({ value, onChange, onError, ...props }) {
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
    const hasError = parsed == null;
    setInputError(hasError);
    onError(hasError ? "invalid" : null);
  }

  React.useEffect(() => {
    if (prevValue != value) {
      updateText(Number(value).toFixed(1));
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

function ColorInput({ value, onChange, onError, ...props }) {
  return (
    <InputWithUnit
      label="Color"
      units={colorUnits}
      defaultUnit="SRM"
      defaultValue="9"
      value={value}
      onChange={onChange}
      onError={onError}
      isValid={(parsed) => parsed >= 0 && parsed <= 100}
      startAdornment={<SquareIcon sx={{ backgroundColor: "white" }} htmlColor={srmToRgb(value)}></SquareIcon>}
      {...props} />
  );
}

function BottlingVolumeInput({ value, onChange, onError, ...props }) {
  return (
    <InputWithUnit
      label="Bottling volume"
      units={volumeUnits}
      defaultUnit="L"
      defaultValue="19"
      value={value}
      onChange={onChange}
      onError={onError}
      isValid={(parsed) => parsed >= 0 && parsed <= 100}
      {...props} />
  );
}

function BottlingDateInput({ value, onChange, onError })  {

  React.useEffect(() => {
    if (value != null && value.isValid()) {
      onError(null);
    }
  }, [value]);

  const handleError = (error) => {
    if (error) {
      onError(error);
    } else if (value == null) {
      onError("missing");
    } else {
      onError(null);
    }
  };

  return (
    <DatePicker
      label="Bottling date"
      variant="outlined"
      disableFuture
      value={value}
      onChange={onChange}
      onError={handleError}
      slotProps={{ textField: { error: value == null || !value.isValid() } }}
      sx={{width:"100%"}} />
  );
}

export default function EntryInputPanel({ weights, entry, onEntryChange }) {

  const [errors, setErrors] = React.useState({});

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

  const handleBottlingVolumeChange = (l) => {
    onEntryChange({ ...entry, bottlingVolume: l });
  };

  const handleBottlingDateChange = (d) => {
    onEntryChange({ ...entry, bottlingDate: d });
  };

  const handleKnownWeight = (mass) => {
    if (!entry.useBottlingVolume) {
      const newEntry = { ...entry, tareOffset: mass, useBottlingVolume: false };
      onEntryChange(newEntry);
    }
  }

  const handleUseBottlingVolumeChange = (e) => {
    const newUseBottlingVolume = e.currentTarget.checked;

    if (newUseBottlingVolume) {
      const newEntry = { ...entry, useBottlingVolume: true };
      delete newEntry.tareOffset;
      onEntryChange(newEntry);
    } else {
      const newEntry = { ...entry, useBottlingVolume: false };
      onEntryChange(newEntry);
    }
  };

  function errorHandler(field) {
    return (error) => {
      setErrors(errors => {
        const newErrors = {...errors};

        if (error) {
          newErrors[field] = error;
        } else {
          delete newErrors[field];
        }

        const isValid = Object.keys(newErrors).length == 0
        if (isValid != entry.isValid) {
          const newEntry = { ...entry, isValid: isValid };
          onEntryChange(newEntry);
        }

        return newErrors;
      });
    };
  }

  return (
    <Grid container spacing={2} columns={{ xs: 1, sm: 2, md: 3 }} sx={{mt: 1}}>
      <Grid item xs={1} sm={2} md={3}>
        <BatchNameInput
          id={entry.id}
          number={entry.number}
          value={entry.name}
          onChange={handleNameChange}
          onError={errorHandler("name")}
          fullWidth />
      </Grid>
      <Grid item xs={1}>
        <AbvInput
            value={entry.abv}
            onChange={handleAbvChange}
            onError={errorHandler("abv")}
            fullWidth />
      </Grid>
      <Grid item xs={1}>
        <DensityInput
            value={entry.finalGravity}
            onChange={handleFinalGravityChange}
            onError={errorHandler("finalGravity")}
            fullWidth />
      </Grid>
      <Grid item xs={1}>
        <ColorInput
          value={entry.srm}
          onChange={handleColorChange}
          onError={errorHandler("srm")}
          fullWidth />
      </Grid>
      <Grid item xs={1}>
        <BottlingDateInput
          value={entry.bottlingDate}
          onChange={handleBottlingDateChange}
          onError={errorHandler("bottlingDate")} />
      </Grid>
      <Grid item xs={1}>
        <BottlingVolumeInput
          value={entry.bottlingVolume}
          onChange={handleBottlingVolumeChange}
          onError={errorHandler("bottlingVolume")}
          fullWidth />
      </Grid>
      <Grid item xs={1}>
        <FormControlLabel control={
          <Switch checked={entry.useBottlingVolume} onChange={handleUseBottlingVolumeChange} />
        } label="Use for measurement" sx={{width:"100%"}} />
      </Grid>
      <Grid item xs={1} sm={2} md={3}>
        {!entry.useBottlingVolume &&
          <Stack direction="row" spacing={2} alignItems="center">
            <Typography>Tare offset:</Typography>
            <KnownWeights forTare isToggle selectFirst weights={weights} onClick={handleKnownWeight} />
          </Stack>}
      </Grid>
    </Grid>
  );
}
