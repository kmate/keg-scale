import * as React from 'react';
import useFetch from "react-fetch-hook";
import useInterval from 'use-interval';
import apiLocation from './apiLocation';

import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme } from '@mui/material/styles';

import { Button, Dialog, DialogActions, DialogContent, DialogTitle, Divider, FormControl, Grid, Input, InputAdornment, InputLabel, Step, StepLabel, Stepper, Typography } from "@mui/material";
import LiveMeasurement from './LiveMeasurement';

/*
// TODO use a stepper to create a wizard to first tare then calibrate
// show a basic measurement view during this, with unit selector
function CalibrationView(props) {
  const [knownMass, setKnownMass] = React.useState(1000);

  function tare() {
    // TODO show UI feedback instead
    console.log("tare scale " + props.index);
    fetch(apiLocation("/tare/" + props.index), { method: "POST" }).then((response) => {
      console.log("tare response:", response);
    })
  }

  function calibrate() {
    // TODO show UI feedback instead
    console.log("calibrate scale " + props.index + " with known mass " + knownMass);
    fetch(apiLocation("/calibrate/" + props.index + "?knownMass=" + knownMass), { method: "POST" }).then((response) => {
      console.log("calibrate response:", response);
    })
  }

  return (
    <>
      <Button onClick={tare}>Tare</Button>
      <FormControl variant="standard">
          <InputLabel htmlFor="known-mass">Known mass</InputLabel>
          <Input
            id="known-mass"
            value={knownMass}
            onChange={(event) => setKnownMass(parseInt(event.target.value) || 0)}
            endAdornment={<InputAdornment position="end">g</InputAdornment>}
          />
        </FormControl>
      <Button onClick={calibrate}>Calibrate</Button>
    </>
  );
}
*/

export default function CalibrationDialog(props) {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('md'));
  const [doingTare, setDoingTare] = React.useState(true);
  const [knownMass, setKnownMass] = React.useState(1000);

  const [tick, setTick] = React.useState(false);
  const { isLoading, data, error } = useFetch(apiLocation("/scale/" + props.index), { depends: [tick] });

  useInterval(() => { setTick(!tick); }, 250, true);

  const handleTare = (e) => {
    // TODO show UI feedback instead
    console.log("tare scale " + props.index);
    fetch(apiLocation("/tare/" + props.index), { method: "POST" }).then((response) => {
      console.log("tare response:", response);
    })
  }

  const handleCalibrate = (e) => {
    // TODO show UI feedback instead
    console.log("calibrate scale " + props.index + " with known mass " + knownMass);
    fetch(apiLocation("/calibrate/" + props.index + "?knownMass=" + knownMass), { method: "POST" }).then((response) => {
      console.log("calibrate response:", response);
    })
  }

  const handleBack = (e) => {
    setDoingTare(true);
  }

  const handleNext = (e) => {
    setDoingTare(false);
  }

  return (
    <Dialog open={props.open} onClose={props.onClose} fullScreen={fullScreen}>
      <DialogTitle>
        <Typography variant="overline" sx={{ flexGrow: 1 }}>{props.label}</Typography>
        <Divider />
        Calibrating
      </DialogTitle>
      <DialogContent>
        <Stepper>
          <Step active={doingTare} key="tare">
            <StepLabel>Tare</StepLabel>
          </Step>
          <Step active={!doingTare} key="calibrate">
            <StepLabel>Calibrate</StepLabel>
          </Step>
        </Stepper>
        <Grid
          container
          spacing={3}
          padding={3}
          direction="column"
          alignItems="center"
          justifyContent="center">
          <Grid item xs={3}>
            <LiveMeasurement value={data && data.state && data.state.data} />
          </Grid>
          {(doingTare &&
            <>
              <Grid item xs={3}>
                <Typography textAlign="center">
                Please remove any weight from the scale to set<br/>zero point and then click Tare.
                </Typography>
              </Grid>
              <Grid item xs={3}>
                <Button onClick={handleTare}>Tare</Button>
              </Grid>
            </>
          )}
          {(!doingTare &&
            <Grid item xs={3}>
              <FormControl variant="standard">
                <InputLabel htmlFor="known-mass">Known mass</InputLabel>
                <Input
                  id="known-mass"
                  value={knownMass}
                  onChange={(event) => setKnownMass(parseInt(event.target.value) || 0)}
                  endAdornment={<InputAdornment position="end">g</InputAdornment>}
                />
              </FormControl>
              <Button onClick={handleCalibrate}>Calibrate</Button>
            </Grid>
          )}
        </Grid>
      </DialogContent>
      <DialogActions>
        {(!doingTare && <Button onClick={handleBack}>Back</Button>)}
        {(doingTare && <Button onClick={handleNext}>Next</Button>)}
        <Button onClick={props.onClose}>{(!doingTare ? 'Done' : 'Close')}</Button>
      </DialogActions>
    </Dialog>
  );
}
