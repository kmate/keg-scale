import * as React from 'react';
import apiLocation from './apiLocation';

import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme } from '@mui/material/styles';

import { Alert, Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, Divider, List, ListItem, Snackbar, Typography } from "@mui/material";
import { Stack } from '@mui/system';

import LiveMeasurement from './LiveMeasurement';
import KnownWeights from './KnownWeights';
import InputWithUnit from './InputWithUnit';
import { massUnits } from './units';

export default function CalibrationDialog({ index, label, data, weights, open, onClose }) {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('md'));
  const [knownMass, setKnownMass] = React.useState(1000);
  const [feedback, setFeedback] = React.useState({ isOpen: false, message: '', severity: 'success' });

  const handleKnownMassChange = (mass) => {
    setKnownMass(mass);
  };

  const handleKnownWeight = (mass) => {
    setKnownMass(mass);
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
            <Box display="flex" alignItems="center" justifyContent="center">
              <InputWithUnit
                label="Known mass"
                units={massUnits}
                defaultUnit="g"
                defaultValue="1000"
                value={knownMass}
                onChange={handleKnownMassChange}
                isValid={(parsed) => parsed >= 0} />
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
