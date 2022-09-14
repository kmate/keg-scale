import * as React from 'react';
import useFetch from "react-fetch-hook";

import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme } from '@mui/material/styles';

import { Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, Divider, Step, StepLabel, Stepper, Typography } from "@mui/material";

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

  return (
    <Dialog open={props.open} onClose={props.onClose} fullScreen={fullScreen}>
      <DialogTitle>
        <Typography variant="overline" sx={{ flexGrow: 1 }}>{props.label}</Typography>
        <Divider />
        Calibrating
      </DialogTitle>
      <DialogContent>
        <Stepper>
          <Step key="tare">
            <StepLabel>Tare</StepLabel>
          </Step>
          <Step key="calibrate">
            <StepLabel>Calibrate</StepLabel>
          </Step>
          <Step key="verify">
            <StepLabel>Verify</StepLabel>
          </Step>
        </Stepper>
        <DialogContentText>
          Please remove any weight from the scale to set zero point and then click Next.
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button>Back</Button>
        <Button>Next</Button>
        <Button>Close</Button>
      </DialogActions>
    </Dialog>
  );
}
