import * as React from 'react';

import AdjustIcon from '@mui/icons-material/Adjust';
import BalanceIcon from '@mui/icons-material/Balance';
import CloudOffIcon from '@mui/icons-material/CloudOff';
import FullscreenIcon from '@mui/icons-material/Fullscreen';
import FullscreenExitIcon from '@mui/icons-material/FullscreenExit';
import PauseIcon from '@mui/icons-material/Pause';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PowerSettingsNewIcon from '@mui/icons-material/PowerSettingsNew';
import SportsBarIcon from '@mui/icons-material/SportsBar';
import StopIcon from '@mui/icons-material/Stop';
import { Box, Button, Divider, IconButton, Paper, Toolbar, Tooltip, Typography } from '@mui/material';
import CalibrationDialog from './CalibrationDialog';
import KnownWeights from './KnownWeights';
import LiveMeasurement from './LiveMeasurement';
import TabPanel from './TabPanel';
import TapMeasurement from './TapMeasurement';
import TapSetupDialog from './TapSetupDialog';
import useLocalStorage from './useLocalStorage';
import { Stack } from '@mui/system';

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
    <Stack height={1}>
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
      <LiveMeasurement flexGrow={10} padding={3} value={data.state.data - tareOffset} />
      <Divider />
      <KnownWeights forTare weights={weights} onClick={handleKnownWeight}>
        <Button onClick={handleReset}>Reset</Button>
        <Button onClick={handleTare}>Tare</Button>
      </KnownWeights>
    </Stack>
  );
}

function RecordingView({ scale, data, fullScreen }) {

  // TODO add visual feed back and error handling + confirmation dialog before these actions
  // maybe use https://www.npmjs.com/package/material-ui-confirm ?

  const handleContinueClick = () => {
    scale.continueRecording();
  };

  const handlePauseClick = () => {
    scale.pauseRecording();
  };

  const handleStopClick = () => {
    scale.stopRecording();
    fullScreen.onExit();
  };

  return (
    <>
      <ScaleToolbar icon={SportsBarIcon} stateName={data && data.state && data.state.tapEntry && data.state.tapEntry.name}>
        {data.state && data.state.isPaused &&
          <Tooltip title="Continue recording">
            <IconButton onClick={handleContinueClick}>
              <PlayArrowIcon />
            </IconButton>
          </Tooltip>}
        {data.state && !data.state.isPaused &&
          <Tooltip title="Pause recording">
            <IconButton onClick={handlePauseClick}>
              <PauseIcon />
            </IconButton>
          </Tooltip>}
        <Tooltip title="Stop recording">
          <IconButton onClick={handleStopClick}>
            <StopIcon />
          </IconButton>
        </Tooltip>
        {!fullScreen.isActive &&
          <Tooltip title="Go fullscreen" edge="end">
            <IconButton onClick={fullScreen.onEnter}>
              <FullscreenIcon />
            </IconButton>
          </Tooltip>}
        {fullScreen.isActive &&
          <Tooltip title="Exit fullscreen" edge="end">
            <IconButton onClick={fullScreen.onExit}>
              <FullscreenExitIcon />
            </IconButton>
          </Tooltip>}
      </ScaleToolbar>
      <Divider />
      {data.state && data.state.data && data.state.tapEntry &&
        <TapMeasurement
          isPaused={data.state.isPaused}
          data={data.state.data}
          tapEntry={data.state.tapEntry} />}
    </>
  );
}

export default function ScalePanel({ scale, data, weights, fullScreen }) {
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

  return data && data.state ? (
    <Box height={1}>
      <Paper sx={ fullScreen.isActive ? { height: 1 } : {}} className="scale-paper">
        <Stack direction="column" height={1}>
          <Typography variant="overline" noWrap paragraph ml={1} mb={0} flexShrink={0}>{scale.label}</Typography>
          <Divider />
          <TabPanel value={data.state.name} index="offline">
            <OfflineView />
          </TabPanel>
          <TabPanel value={data.state.name} index="standby">
            <StandbyView scale={scale} onTapSetupClick={handleTapSetupClick} />
          </TabPanel>
          <TabPanel value={data.state.name} index="liveMeasurement" className="stretched-tab-panel">
            <LiveMeasurementView scale={scale} data={data} weights={weights} onCalibrationClick={handleCalibrationClick} />
          </TabPanel>
          <TabPanel value={data.state.name} index="recording" className="stretched-tab-panel">
            <RecordingView scale={scale} data={data} fullScreen={fullScreen} />
          </TabPanel>
        </Stack>
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
      </Paper>
    </Box>
  ) : <></>;
}
