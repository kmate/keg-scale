import * as React from 'react';
import useFetch from "react-fetch-hook";
import useInterval from 'use-interval';
import apiLocation from './apiLocation';

import { styled } from '@mui/material/styles';
import { Box, Button, FormControl, Grid, Input, InputAdornment, InputLabel, Paper } from '@mui/material';
import ErrorIndicator from './ErrorIndicator';
import LoadingIndicator from './LoadingIndicator';

const Panel = styled(Paper)(({ theme }) => ({
  ...theme.typography.body2,
  padding: theme.spacing(1),
}));

function ScalePanel(props) {
  const [tick, setTick] = React.useState(false);
  const [knownMass, setKnownMass] = React.useState(1000);

  useInterval(
    () => { setTick(!tick); },
    1000 // TODO this might depend on the actual state
  );

  const { isLoading, data, error } = useFetch(apiLocation("/scale/" + props.index), { depends: [tick] });

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

  // TODO finalize UI depending on actual scale state
  return (
    <Grid item xs={2} md={1}>
      <Panel>
        { (data && data.state ? <p>{data.state.name} {data.state.data}</p> : <p>no data</p>) }
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
      </Panel>
    </Grid>
  );
}

function ScalePanelGrid(props) {
  return (
    <Box sx={{ flexGrow: 1, p: 1 }}>
      <Grid container columns={2} spacing={1}>
        {[...Array(props.numScales).keys()].map((index) => {
          return <ScalePanel key={"scale_" + index} index={index} />;
        })}
      </Grid>
    </Box>
  );
}

export default function ScalesPanel() {

  const { isLoading, data, error } = useFetch(apiLocation("/scales"));

  return(
    <>
      { isLoading ? <LoadingIndicator /> : (error ? <ErrorIndicator error={error} /> : <ScalePanelGrid numScales={data.numScales} />)}
    </>
  );
}
