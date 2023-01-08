import * as React from 'react';
import useFetch from "react-fetch-hook";
import useInterval from 'use-interval';
import apiLocation from './apiLocation';

import { Button, Divider, IconButton, Paper, Toolbar, Typography } from '@mui/material';
import CloudOffIcon from '@mui/icons-material/CloudOff';
import PowerSettingsNewIcon from '@mui/icons-material/PowerSettingsNew';
import AdjustIcon from '@mui/icons-material/Adjust';
import BalanceIcon from '@mui/icons-material/Balance';
import RefreshIcon from '@mui/icons-material/Refresh';
import SportsBarIcon from '@mui/icons-material/SportsBar';

import TabPanel from './TabPanel';
import CalibrationDialog from './CalibrationDialog';
import LiveMeasurement from './LiveMeasurement';
import KnownWeights from './KnownWeights';
import useLocalStorage from './useLocalStorage';

const states = {
  offline: {
    refreshSeconds: 30
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

function ScaleToolbar(props) {
  const Icon = props.icon;

  return (
    <Toolbar variant="dense" disableGutters sx={{ mr: 2 }}>
      {<Icon sx={{ ml: 1, mr: 1 }} />}
      <Typography variant="h6" noWrap sx={{ flexGrow: 1 }}>{props.stateName}</Typography>
      {props.children}
    </Toolbar>
  );
}

function OfflineView(props) {
  return (
    <ScaleToolbar icon={CloudOffIcon} stateName="Offline">
      <IconButton onClick={props.onRefreshClick} edge="end">
        <RefreshIcon />
      </IconButton>
    </ScaleToolbar>
  );
}

function StandbyView(props) {
  const handleLiveMeasurementClick = () => {
    fetch(apiLocation("/live/" + props.index), { method: "POST" });
  };

  const handleTapMeasurementClick = () => {

  };

  return (
    <ScaleToolbar icon={PowerSettingsNewIcon} stateName="Standby">
      <IconButton onClick={props.onCalibrationClick}>
        <AdjustIcon />
      </IconButton>
      <IconButton onClick={handleLiveMeasurementClick}>
        <BalanceIcon />
      </IconButton>
      <IconButton onClick={handleTapMeasurementClick} edge="end">
        <SportsBarIcon />
      </IconButton>
    </ScaleToolbar>
  );
}

function LiveMeasurementView(props) {
  const [tareOffset, setTareOffset] = useLocalStorage("tareOffset_" + props.index, 0);

  const handleStandbyClick = () => {
    fetch(apiLocation("/standby/" + props.index), { method: "POST" });
  };

  const handleKnownWeight = (mass) => {
    setTareOffset(mass);
  };

  const handleReset = () => {
    setTareOffset(0);
  };

  const handleTare = () => {
    setTareOffset(props.data.state.data);
  };

  return (
    <>
      <ScaleToolbar icon={BalanceIcon} stateName="Live measurement">
        <IconButton onClick={props.onCalibrationClick}>
          <AdjustIcon />
        </IconButton>
        <IconButton onClick={handleStandbyClick} edge="end">
          <PowerSettingsNewIcon />
        </IconButton>
      </ScaleToolbar>
      <Divider />
      <LiveMeasurement padding={3} value={props.data.state.data - tareOffset} />
      <Divider />
      <KnownWeights weights={props.weights} forTare={true} onClick={handleKnownWeight}>
        <Button onClick={handleReset}>Reset</Button>
        <Button onClick={handleTare}>Tare</Button>
      </KnownWeights>
    </>
  );
}

// TODO add a wizard to set up the recording
function TapMeasurementView(props) {
  return <></>;
}

export default function ScalePanel(props) {
  const [tick, setTick] = React.useState(false);
  const [calibrationIsOpen, setCalibrationIsOpen] = React.useState(false);

  const triggerFetch = () => {
    setTick((prevTick) => !prevTick);
  };

  const handleRefreshClick = () => {
    triggerFetch();
  };

  const handleCalibrationClick = () => {
    setCalibrationIsOpen(true);
  };

  const handleCalibrationClose = () => {
    setCalibrationIsOpen(false);
  };

  const { isLoading, data, error } = useFetch(apiLocation("/scale/" + props.index), { depends: [tick] });

  const delayInSeconds = data && data.state && states[data.state.name].refreshSeconds || 10;
  useInterval(() => { triggerFetch(); }, calibrationIsOpen ? null : (delayInSeconds * 1000), true);

  // TODO figure out how to show debug data
  return (
    <Paper>
      { data && data.state && (
        <>
          <Typography variant="overline" noWrap paragraph ml={1} mb={0}>{props.scale.label}</Typography>
          <Divider />
          <TabPanel value={data.state.name} index="offline">
            <OfflineView index={props.index} data={data} onRefreshClick={handleRefreshClick} />
          </TabPanel>
          <TabPanel value={data.state.name} index="standby">
            <StandbyView index={props.index} data={data} onCalibrationClick={handleCalibrationClick} />
          </TabPanel>
          <TabPanel value={data.state.name} index="liveMeasurement">
            <LiveMeasurementView index={props.index} data={data} weights={props.weights} onCalibrationClick={handleCalibrationClick} />
          </TabPanel>
          <CalibrationDialog
            open={data.state.name != "offline" && calibrationIsOpen}
            onClose={handleCalibrationClose}
            index={props.index}
            label={props.scale.label}
            weights={props.weights}
          />
        </>
      )}
    </Paper>
  );
}
