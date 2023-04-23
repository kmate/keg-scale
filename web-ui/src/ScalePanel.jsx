import * as React from 'react';

import AdjustIcon from '@mui/icons-material/Adjust';
import BalanceIcon from '@mui/icons-material/Balance';
import CloudOffIcon from '@mui/icons-material/CloudOff';
import PauseIcon from '@mui/icons-material/Pause';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PowerSettingsNewIcon from '@mui/icons-material/PowerSettingsNew';
import SportsBarIcon from '@mui/icons-material/SportsBar';
import StopIcon from '@mui/icons-material/Stop';
import { Button, Divider, IconButton, Paper, Toolbar, Tooltip, Typography } from '@mui/material';
import { Stack } from '@mui/system';
import CalibrationDialog from './CalibrationDialog';
import KnownWeights from './KnownWeights';
import LiveMeasurement from './LiveMeasurement';
import TabPanel from './TabPanel';
import TapSetupDialog from './TapSetupDialog';
import useLocalStorage from './useLocalStorage';

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

function StandbyView({ scale, onTapSetupClick }) {
  const handleLiveMeasurementClick = () => {
    scale.liveMeasurement();
  };

  return (
    <ScaleToolbar icon={PowerSettingsNewIcon} stateName="Standby">
      <Tooltip title="Tap setup">
        <IconButton onClick={onTapSetupClick}>
          <SportsBarIcon />
        </IconButton>
      </Tooltip>
      <Tooltip title="Live measurement">
        <IconButton onClick={handleLiveMeasurementClick} edge="end">
          <BalanceIcon />
        </IconButton>
      </Tooltip>
    </ScaleToolbar>
  );
}

function LiveMeasurementView({ scale, data, weights, onCalibrationClick }) {
  const [tareOffset, setTareOffset] = useLocalStorage("tareOffset_" + scale.index, 0);

  const handleStandbyClick = () => {
    scale.standby();
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

function RecordingView({ scale, data }) {
  // TODO add pause/continue & stop buttons instead
  // Put the batch name in the title instead?
  return (
    <>
      <ScaleToolbar icon={SportsBarIcon} stateName="TODO put batch name here">
       {data.isPaused &&
        <Tooltip title="Continue recording">
            <IconButton>
              <PlayArrowIcon />
            </IconButton>
          </Tooltip>}
        {!data.isPaused &&
          <Tooltip title="Pause recording">
            <IconButton>
              <PauseIcon />
            </IconButton>
          </Tooltip>}
        <Tooltip title="Stop recording">
          <IconButton edge="end">
            <StopIcon />
          </IconButton>
        </Tooltip>
      </ScaleToolbar>
      <Divider />
      <Stack direction="row">
        <Typography>TODO put actual value and graph here</Typography>
      </Stack>
    </>
  );
}

export default function ScalePanel({ scale, data, weights }) {
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
          <Typography variant="overline" noWrap paragraph ml={1} mb={0}>{scale.label}</Typography>
          <Divider />
          <TabPanel value={data.state.name} index="offline">
            <OfflineView />
          </TabPanel>
          <TabPanel value={data.state.name} index="standby">
            <StandbyView scale={scale} onTapSetupClick={handleTapSetupClick} />
          </TabPanel>
          <TabPanel value={data.state.name} index="liveMeasurement">
            <LiveMeasurementView scale={scale} data={data} weights={weights} onCalibrationClick={handleCalibrationClick} />
          </TabPanel>
          <TabPanel value={data.state.name} index="recording">
            <RecordingView scale={scale} data={data} />
          </TabPanel>
          <CalibrationDialog
            open={data.state.name != "offline" && calibrationIsOpen}
            onClose={handleCalibrationClose}
            scale={scale}
            data={data}
            weights={weights} />
          <TapSetupDialog
            open={data.state.name != "offline" && tapSetupIsOpen}
            onClose={handleTapSetupClose}
            scale={scale}
            weights={weights} />
        </>
      )}
    </Paper>
  );
}
