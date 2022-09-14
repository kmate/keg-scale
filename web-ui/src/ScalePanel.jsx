import * as React from 'react';
import useFetch from "react-fetch-hook";
import useInterval from 'use-interval';
import apiLocation from './apiLocation';

import { Button, Divider, FormControl, IconButton, MenuItem, Paper, Select, TextField, Toolbar, Typography } from '@mui/material';
import CloudOffIcon from '@mui/icons-material/CloudOff';
import PowerSettingsNewIcon from '@mui/icons-material/PowerSettingsNew';
import AdjustIcon from '@mui/icons-material/Adjust';
import BalanceIcon from '@mui/icons-material/Balance';
import SportsBarIcon from '@mui/icons-material/SportsBar';

import TabPanel from './TabPanel';
import CalibrationDialog from './CalibrationDialog';
import { Box } from '@mui/system';

const states = {
  offline: {
    refreshSeconds: 10
  },
  standby: {
    refreshSeconds: 1
  },
  tare: {
    refreshSeconds: 1
  },
  calibrate: {
    refreshSeconds: 1
  },
  liveMeasurement: {
    refreshSeconds: 1
  },
  tapMeasurement: {
    refreshSeconds: 1
  }
}

function CalibrateButton(props) {
  const [dialogIsOpen, setDialogIsOpen] = React.useState(false);

  const handleClick = () => {
    setDialogIsOpen(true);
  };

  const handleDialogClose = () => {
    setDialogIsOpen(false);
  };

  return (
    <>
      <IconButton onClick={handleClick} edge={props.edge}>
        <AdjustIcon />
      </IconButton>
      <CalibrationDialog open={dialogIsOpen} onClose={handleDialogClose} label={props.label} index={props.index} />
    </>
  );
}

function ScaleToolbar(props) {
  const Icon = props.icon;

  return (
    <>
      <Typography variant="overline" noWrap paragraph ml={1} mb={0}>{props.label}</Typography>
      <Divider />
      <Toolbar variant="dense" disableGutters sx={{ mr: 2 }}>
        {<Icon sx={{ ml: 1, mr: 1 }} />}
        <Typography variant="h6" noWrap sx={{ flexGrow: 1 }}>{props.stateName}</Typography>
        {props.children}
      </Toolbar>
    </>
  );
}

function OfflineView(props) {
  return <ScaleToolbar icon={CloudOffIcon} label={props.data.label} stateName="Offline" />;
}

function StandbyView(props) {
  const handleLiveMeasurementClick = () => {
    fetch(apiLocation("/live/" + props.index), { method: "POST" });
  };

  const handleTapMeasurementClick = () => {

  };

  return (
    <ScaleToolbar icon={PowerSettingsNewIcon} label={props.data.label} stateName="Standby">
      <IconButton onClick={handleLiveMeasurementClick}>
        <BalanceIcon />
      </IconButton>
      <IconButton onClick={handleTapMeasurementClick}>
        <SportsBarIcon />
      </IconButton>
      <CalibrateButton label={props.data.label} index={props.index} edge="end" />
    </ScaleToolbar>
  );
}

const measuredUnits = {
  g: {
    multiplier: 1,
    digits: 0,
    isVolumeUnit: false
  },
  kg: {
    multiplier: 1/1000,
    digits: 2,
    isVolumeUnit: false
  },
  dl: {
    multiplier: 10, // g/L is the default
    digits: 1,
    isVolumeUnit: true
  },
  l: {
    multiplier: 1, // g/L is the default
    digits: 2,
    isVolumeUnit: true
  },
  // TODO add lbs, oz, uk/us galon and other units
}

const densityUnits = {
  "g/L": {
    converter: (d) => d
  },
  // TODO add Plato, Brix and other density units
}

function LiveMeasurementView(props) {
  const [measuredUnit, setMeasuredUnit] = React.useState("g");
  const [density, setDensity] = React.useState(1000);
  const [densityUnit, setDensityUnit] = React.useState("g/L");

  const handleStandbyClick = () => {
    fetch(apiLocation("/standby/" + props.index), { method: "POST" });
  };

  const handleMeasuredUnitChange = (e) => {
    setMeasuredUnit(e.target.value);
  };

  const handleDensityChange = (e) => {
    setDensity(Number.parseFloat(e.target.value));
  }

  const handleDensityUnitChange = (e) => {
    setDensityUnit(e.target.value);
    // TODO set density based on conversion
  };

  const currentMU = measuredUnits[measuredUnit];
  const currentDU = densityUnits[densityUnit];
  const densityQuotient = currentMU.isVolumeUnit ? currentDU.converter(density) : 1;
  const convertedValue = (props.data.state.data * currentMU.multiplier / densityQuotient).toFixed(currentMU.digits);

  return (
    <>
      <ScaleToolbar icon={BalanceIcon} label={props.data.label} stateName="Live measurement">
        <CalibrateButton label={props.data.label} index={props.index} />
        <IconButton onClick={handleStandbyClick} edge="end">
          <PowerSettingsNewIcon />
        </IconButton>
      </ScaleToolbar>
      <Box>
        <Typography variant="h3" component="span" ml={1} mr={1}>{convertedValue}</Typography>
        <FormControl sx={{ minWidth: "80px" }}>
          <Select value={measuredUnit} onChange={handleMeasuredUnitChange}>
            {Object.keys(measuredUnits).map(unit => {
              return <MenuItem key={ "measured_unit_" + unit } value={unit}>{unit}</MenuItem>;
            })}
          </Select>
        </FormControl>
      </Box>
      {currentMU.isVolumeUnit && (
        <Box>
          <TextField label="Density" variant="outlined" value={density} onChange={handleDensityChange} />
          <FormControl sx={{ minWidth: "80px" }}>
            <Select value={densityUnit} onChange={handleDensityUnitChange}>
              {Object.keys(densityUnits).map(unit => {
                return <MenuItem key={ "density_unit_" + unit } value={unit}>{unit}</MenuItem>;
              })}
            </Select>
          </FormControl>
        </Box>
      )}
      <Box>
        <Button>Tare to zero</Button>
        <Button>Tare current</Button>
        TODO: add tare to known weights
      </Box>
    </>
  );
}

// TODO add a wizard to set up the recording
function TapMeasurementView(props) {
  return <></>;
}



export default function ScalePanel(props) {
  const [tick, setTick] = React.useState(false);

  const { isLoading, data, error } = useFetch(apiLocation("/scale/" + props.index), { depends: [tick] });

  useInterval(
    () => { setTick(!tick); },
    (data && data.state && states[data.state.name].refreshSeconds || 10) * 1000,
    true
  );

  // TODO figure out how to show debug data
  return (
    <Paper>
      { data && data.state && (
        <>
          <TabPanel value={data.state.name} index="offline"><OfflineView index={props.index} data={data} /></TabPanel>
          <TabPanel value={data.state.name} index="standby"><StandbyView index={props.index} data={data} /></TabPanel>
          <TabPanel value={data.state.name} index="liveMeasurement"><LiveMeasurementView index={props.index} data={data} /></TabPanel>
        </>
      )}
    </Paper>
  );
}
