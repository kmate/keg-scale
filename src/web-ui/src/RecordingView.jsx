import { useConfirm } from 'material-ui-confirm';
import * as React from 'react';
import sanitize from 'sanitize-filename';

import DownloadIcon from '@mui/icons-material/Download';
import FullscreenIcon from '@mui/icons-material/Fullscreen';
import FullscreenExitIcon from '@mui/icons-material/FullscreenExit';
import PauseIcon from '@mui/icons-material/Pause';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import SportsBarIcon from '@mui/icons-material/SportsBar';
import StopIcon from '@mui/icons-material/Stop';
import Alert from '@mui/material/Alert';
import DialogContentText from '@mui/material/DialogContentText';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import Snackbar from '@mui/material/Snackbar';
import Tooltip from '@mui/material/Tooltip';

import ScaleToolbar from './ScaleToolbar';
import TapMeasurement from './TapMeasurement';

export default function RecordingView({ scale, data, fullScreen }) {
  const [feedback, setFeedback] = React.useState({ isOpen: false, message: '', severity: 'success' });
  const confirm = useConfirm();

  const downloadTapData = () => {
    try {
      const blob = new Blob([JSON.stringify(data.state)], { type: "application/json" });
      const a = document.createElement("a");
      a.href = window.URL.createObjectURL(blob);
      a.download = sanitize(data.state.tapEntry.bottlingDate + " " + data.state.tapEntry.name) + ".keg.json";
      a.click();
      return true;
    } catch {
      setFeedback({ isOpen: true, message: 'Download recording data failed!', severity: 'error' });
      return false;
    }
  };

  const handleDownloadTapDataClick = () => {
    downloadTapData();
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
    const dialogContent =
      <DialogContentText>
        Do you want to stop recording?<br/>
        (This will download you a copy of the tap data.)
      </DialogContentText>;

    confirm({ content: dialogContent }).then(() => {
      if (downloadTapData()) {
        // only stop recording if download succeeded
        scale.stopRecording()
        .then(() => {
          setFeedback({ isOpen: true, message: 'Recording stopped!', severity: 'success' });
          fullScreen.onExit();
        })
        .catch(() => {
          setFeedback({ isOpen: true, message: 'Stop recording failed!', severity: 'error' });
        });
      }
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
