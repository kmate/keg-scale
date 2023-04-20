import * as React from 'react';
import apiLocation from './apiLocation';

import { Button, Divider, IconButton, Paper, Toolbar, Tooltip, Typography } from '@mui/material';
import CloudOffIcon from '@mui/icons-material/CloudOff';
import PowerSettingsNewIcon from '@mui/icons-material/PowerSettingsNew';
import AdjustIcon from '@mui/icons-material/Adjust';
import BalanceIcon from '@mui/icons-material/Balance';
import SportsBarIcon from '@mui/icons-material/SportsBar';

import TabPanel from './TabPanel';
import CalibrationDialog from './CalibrationDialog';
import LiveMeasurement from './LiveMeasurement';
import KnownWeights from './KnownWeights';
import useLocalStorage from './useLocalStorage';
import TapSetupDialog from './TapSetupDialog';

function ScaleToolbar({ children, icon, stateName }) {
  const Icon = icon;

  return (
    <Toolbar variant="dense" disableGutters sx={{ mr: 2 }}>
      {<Icon sx={{ ml: 1, mr: 1 }} />}
      <Typography variant="h6" noWrap sx={{ flexGrow: 1 }}>{stateName}</Typography>
      {children}
    </Toolbar>
  );
}

function OfflineView() {
  return <ScaleToolbar icon={CloudOffIcon} stateName="Offline" />;
}

function StandbyView({ index, onCalibrationClick, onTapSetupClick }) {
  const handleLiveMeasurementClick = () => {
    fetch(apiLocation("/live/" + index), { method: "POST" });
  };

  return (
    <ScaleToolbar icon={PowerSettingsNewIcon} stateName="Standby">
      <Tooltip title="Calibrate">
        <IconButton onClick={onCalibrationClick}>
          <AdjustIcon />
        </IconButton>
      </Tooltip>
      <Tooltip title="Live measurement">
        <IconButton onClick={handleLiveMeasurementClick}>
          <BalanceIcon />
        </IconButton>
      </Tooltip>
      <Tooltip title="Tap setup">
        <IconButton onClick={onTapSetupClick} edge="end">
          <SportsBarIcon />
        </IconButton>
      </Tooltip>
    </ScaleToolbar>
  );
}

function LiveMeasurementView({ index, data, weights, onCalibrationClick }) {
  const [tareOffset, setTareOffset] = useLocalStorage("tareOffset_" + index, 0);

  const handleStandbyClick = () => {
    fetch(apiLocation("/standby/" + index), { method: "POST" });
  };

  const handleKnownWeight = (mass) => {
    setTareOffset(mass);
  };

  const handleReset = () => {
    setTareOffset(0);
  };

  const handleTare = () => {
    setTareOffset(data.state.data);
  };

  return (
    <>
      <ScaleToolbar icon={BalanceIcon} stateName="Live measurement">
        <Tooltip title="Calibrate">
          <IconButton onClick={onCalibrationClick}>
            <AdjustIcon />
          </IconButton>
        </Tooltip>
        <Tooltip title="Standby">
          <IconButton onClick={handleStandbyClick} edge="end">
            <PowerSettingsNewIcon />
          </IconButton>
        </Tooltip>
      </ScaleToolbar>
      <Divider />
      <LiveMeasurement padding={3} value={data.state.data - tareOffset} />
      <Divider />
      <KnownWeights forTare weights={weights} onClick={handleKnownWeight}>
        <Button onClick={handleReset}>Reset</Button>
        <Button onClick={handleTare}>Tare</Button>
      </KnownWeights>
    </>
  );
}

function TapMeasurementView(props) {
  return <></>;
}

export default function ScalePanel({ index, label, data, weights }) {
  const [calibrationIsOpen, setCalibrationIsOpen] = React.useState(false);
  const [tapSetupIsOpen, setTapSetupIsOpen] = React.useState(false);

  const handleCalibrationClick = () => {
    setCalibrationIsOpen(true);
  };

  const handleCalibrationClose = () => {
    setCalibrationIsOpen(false);
  };

  const handleTapSetupClick = () => {
    setTapSetupIsOpen(true);
  };

  const handleTapSetupClose = () => {
    setTapSetupIsOpen(false);
  };

  // TODO figure out how to show debug data
  return (
    <Paper>
      { data && data.state && (
        <>
          <Typography variant="overline" noWrap paragraph ml={1} mb={0}>{label}</Typography>
          <Divider />
          <TabPanel value={data.state.name} index="offline">
            <OfflineView index={index} data={data} />
          </TabPanel>
          <TabPanel value={data.state.name} index="standby">
            <StandbyView index={index} data={data} onCalibrationClick={handleCalibrationClick} onTapSetupClick={handleTapSetupClick} />
          </TabPanel>
          <TabPanel value={data.state.name} index="liveMeasurement">
            <LiveMeasurementView index={index} data={data} weights={weights} onCalibrationClick={handleCalibrationClick} />
          </TabPanel>
          <CalibrationDialog
            open={data.state.name != "offline" && calibrationIsOpen}
            onClose={handleCalibrationClose}
            data={data}
            index={index}
            label={label}
            weights={weights}
          />
          <TapSetupDialog
            open={data.state.name != "offline" && tapSetupIsOpen}
            onClose={handleTapSetupClose}
            index={index}
            label={label}
            weights={weights}
          />
        </>
      )}
    </Paper>
  );
}
