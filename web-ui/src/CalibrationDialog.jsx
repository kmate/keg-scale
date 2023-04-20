import * as React from 'react';
import useFetch from "react-fetch-hook";
import useInterval from 'use-interval';
import apiLocation from './apiLocation';

import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme } from '@mui/material/styles';

import { Alert, Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, Divider, FormControl, List, ListItem, MenuItem, Select, Snackbar, TextField, Typography } from "@mui/material";
import { Stack } from '@mui/system';

import LiveMeasurement from './LiveMeasurement';
import KnownWeights from './KnownWeights';

const weightUnits = {
  g: {
    multiplier: 1,
    digits: 0
  },
  kg: {
    multiplier: 1/1000,
    digits: 2,
  }
};

export default function CalibrationDialog({ index, label, data, weights, open, onClose }) {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('md'));
  const [knownMass, setKnownMass] = React.useState(1000);
  const [massUnit, setMassUnit] = React.useState("g");
  const [feedback, setFeedback] = React.useState({ isOpen: false, message: '', severity: 'success' });

  const handleKnownMassChange = (e) => {
    const text = e.target.value;
    if (text != "") {
      const parsed = Number.parseFloat(text);
      if (!Number.isNaN(parsed) && parsed > 0) {
        setKnownMass(parsed);
      }
    } else {
      setKnownMass(0);
    }
  };

  const handleKnownWeight = (mass) => {
    const weightUnit = weightUnits[massUnit];
    setKnownMass((mass * weightUnit.multiplier).toFixed(weightUnit.digits));
  };

  const handleMassUnitChange = (e) => {
    const oldWeightUnit = weightUnits[massUnit];
    const newUnitName = e.target.value;
    setMassUnit(newUnitName);
    const newWeightUnit = weightUnits[newUnitName];
    setKnownMass((knownMass / oldWeightUnit.multiplier * newWeightUnit.multiplier).toFixed(newWeightUnit.digits));
  };

  const handleTare = () => {
    fetch(apiLocation("/tare/" + index), { method: "POST" }).then((response) => {
      if (response.ok) {
        setFeedback({ isOpen: true, message: 'Tare complete!', severity: 'success' });
      } else {
        setFeedback({ isOpen: true, message: 'Tare failed!', severity: 'error' });
      }
    })
  };

  const handleCalibrate = () => {
    fetch(apiLocation("/calibrate/" + index + "?knownMass=" + knownMass), { method: "POST" }).then((response) => {
      if (response.ok) {
        setFeedback({ isOpen: true, message: 'Calibration complete!', severity: 'success' });
      } else {
        setFeedback({ isOpen: true, message: 'Calibration failed!', severity: 'error' });
      }
    })
  };

  const handleSave = () => {
    fetch(apiLocation("/persist"), { method: "POST" }).then((response) => {
      if (response.ok) {
        setFeedback({ isOpen: true, message: 'Saving complete!', severity: 'success' });
      } else {
        setFeedback({ isOpen: true, message: 'Saving failed!', severity: 'error' });
      }
    })
    onClose();
  }

  const handleFeedbackClose = () => {
    setFeedback({ ...feedback, isOpen: false });
  };

  return (
    <>
      <Dialog open={open} onClose={onClose} fullScreen={fullScreen} fullWidth maxWidth="md" scroll="body">
        <DialogTitle variant="h6" sx={{ flexGrow: 1 }}>
          <Typography variant="overline" noWrap paragraph mb={0}>{label}</Typography>
          <Divider />
          Calibration
        </DialogTitle>
        <DialogContent>
          <Stack spacing={3}>
            <List>
              <ListItem>
                1. Please remove any weight from the scale to set zero point, then click Tare.
              </ListItem>
              <ListItem>
                2. Put a known weight on the scale and enter its mass or select from the presets, then click Calibrate.
              </ListItem>
              <ListItem>
                3. Repeat the above procedure until you reach the desired accuracy.
              </ListItem>
            </List>
            <Divider />
            <LiveMeasurement value={data && data.state && data.state.data} />
            <Divider />
            {/* TODO use InputWithUnit? */}
            <Box display="flex" alignItems="center" justifyContent="center">
              <TextField
                sx={{input: {textAlign: 'right'}}}
                label="Known mass"
                variant="outlined"
                value={knownMass}
                onChange={handleKnownMassChange} />
              <FormControl sx={{ minWidth: "80px", ml: 1 }}>
                <Select value={massUnit} onChange={handleMassUnitChange}>
                  {Object.keys(weightUnits).map(unit => {
                    return <MenuItem key={ "weight_unit_" + unit } value={unit}>{unit}</MenuItem>;
                  })}
                </Select>
              </FormControl>
            </Box>
            <KnownWeights forCalibration weights={weights} onClick={handleKnownWeight} />
          </Stack>
        </DialogContent>
        <Divider />
        <DialogActions>
          <Button onClick={handleTare}>Tare</Button>
          <Button onClick={handleCalibrate}>Calibrate</Button>
          <div style={{flex: '1 0 0'}} />
          <Button onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave}>Save</Button>
        </DialogActions>
      </Dialog>
      <Snackbar open={feedback.isOpen} autoHideDuration={1000} onClose={handleFeedbackClose}>
        <Alert onClose={handleFeedbackClose} severity={feedback.severity}>
          {feedback.message}
        </Alert>
      </Snackbar>
    </>
  );
}
