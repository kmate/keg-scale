import * as React from 'react';
import { useConfirm } from 'material-ui-confirm';

import AdjustIcon from '@mui/icons-material/Adjust';
import BalanceIcon from '@mui/icons-material/Balance';
import CloudOffIcon from '@mui/icons-material/CloudOff';
import DownloadIcon from '@mui/icons-material/Download';
import FullscreenIcon from '@mui/icons-material/Fullscreen';
import FullscreenExitIcon from '@mui/icons-material/FullscreenExit';
import PauseIcon from '@mui/icons-material/Pause';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PowerSettingsNewIcon from '@mui/icons-material/PowerSettingsNew';
import SportsBarIcon from '@mui/icons-material/SportsBar';
import StopIcon from '@mui/icons-material/Stop';
import UploadIcon from '@mui/icons-material/Upload';
import { Alert, Box, Button, Divider, IconButton, Paper, Snackbar, Toolbar, Tooltip, Typography } from '@mui/material';
import { Stack } from '@mui/system';
import apiLocation from './apiLocation';
import CalibrationDialog from './CalibrationDialog';
import KnownWeights from './KnownWeights';
import LiveMeasurement from './LiveMeasurement';
import TabPanel from './TabPanel';
import TapMeasurement from './TapMeasurement';
import TapSetupDialog from './TapSetupDialog';
import UploadTapDataDialog from './UploadTapDataDialog';
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

function StandbyView({ scale, onUploadTapDataClick, onTapSetupClick }) {
  const handleLiveMeasurementClick = () => {
    scale.liveMeasurement();
  };

  return (
    <ScaleToolbar icon={PowerSettingsNewIcon} stateName="Standby">
      <Tooltip title="Upload tap data">
        <IconButton onClick={onUploadTapDataClick}>
          <UploadIcon />
        </IconButton>
      </Tooltip>
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
  const [feedback, setFeedback] = React.useState({ isOpen: false, message: '', severity: 'success' });
  const confirm = useConfirm();

  const handleDownloadTapDataClick = () => {
    fetch(apiLocation("/recording/download/?index=" + scale.index), { method: "GET" }).then((response) => {
      if (!response.ok) {
        setFeedback({ isOpen: true, message: 'Download recording data failed!', severity: 'error' });
        return Promise.reject(response);
      } else {
        return response.blob();
      }
    }).then((blob) => {
      const a = document.createElement("a");
      a.href = window.URL.createObjectURL(blob);
      a.download = data.state.tapEntry.name + ".keg.json";
      a.click();
    });
  }

  const handleContinueClick = () => {
    confirm({ description: "Do you want to continue recording?" }).then(() => {
      scale.continueRecording()
        .then(() => {
          setFeedback({ isOpen: true, message: 'Recording continues!', severity: 'success' });
        })
        .catch(() => {
          setFeedback({ isOpen: true, message: 'Continue recording failed!', severity: 'error' });
        });
    }).catch(() => {});
  };

  const handlePauseClick = () => {
    confirm({ description: "Do you want to pause recording?" }).then(() => {
      scale.pauseRecording()
        .then(() => {
          setFeedback({ isOpen: true, message: 'Recording paused!', severity: 'success' });
        })
        .catch(() => {
          setFeedback({ isOpen: true, message: 'Pause recording failed!', severity: 'error' });
        });
    }).catch(() => {});
  };

  const handleStopClick = () => {
    confirm({ description: "Do you want to stop recording?" }).then(() => {
      scale.stopRecording()
        .then(() => {
          setFeedback({ isOpen: true, message: 'Recording stopped!', severity: 'success' });
          fullScreen.onExit();
        })
        .catch(() => {
          setFeedback({ isOpen: true, message: 'Stop recording failed!', severity: 'error' });
        });
    }).catch(() => {});
  };

  const handleFeedbackClose = () => {
    setFeedback({ ...feedback, isOpen: false });
  };

  return (
    <>
      <ScaleToolbar icon={SportsBarIcon} stateName={data && data.state && data.state.tapEntry && data.state.tapEntry.name}>
        {data.state && data.state.isPaused &&
          <>
            <Tooltip title="Download tap data">
              <IconButton onClick={handleDownloadTapDataClick}>
                <DownloadIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Continue recording">
              <IconButton onClick={handleContinueClick}>
                <PlayArrowIcon />
              </IconButton>
            </Tooltip>
          </>}
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
          scaleIndex={scale.index}
          isPaused={data.state.isPaused}
          data={data.state.data}
          tapEntry={data.state.tapEntry} />}
      <Snackbar open={feedback.isOpen} autoHideDuration={1000} onClose={handleFeedbackClose}>
        <Alert onClose={handleFeedbackClose} severity={feedback.severity}>
          {feedback.message}
        </Alert>
      </Snackbar>
    </>
  );
}

export default function ScalePanel({ scale, data, weights, fullScreen }) {
  const [calibrationIsOpen, setCalibrationIsOpen] = React.useState(false);
  const [tapSetupIsOpen, setTapSetupIsOpen] = React.useState(false);
  const [uploadTapDataIsOpen, setUploadTapDataIsOpen] = React.useState(false);

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

  const handleUploadTapDataClick = () => {
    setUploadTapDataIsOpen(true);
  }

  const handleUploadDataClose = () => {
    setUploadTapDataIsOpen(false);
  }

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
            <StandbyView scale={scale} onTapSetupClick={handleTapSetupClick} onUploadTapDataClick={handleUploadTapDataClick} />
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
        <UploadTapDataDialog
          open={data.state.name != "offline" && uploadTapDataIsOpen}
          onClose={handleUploadDataClose}
          scale={scale}
          />
      </Paper>
    </Box>
  ) : <></>;
}
