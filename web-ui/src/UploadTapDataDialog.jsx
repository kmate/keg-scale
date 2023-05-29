import * as React from 'react';
import { useDropzone } from 'react-dropzone'

import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme } from '@mui/material/styles';
import { Alert, Button, Dialog, DialogActions, DialogContent, DialogTitle, Divider, IconButton, List, Snackbar, Tooltip, Typography } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import TapEntry from './TapEntry';
import TapChart from './TapChart';
import useLocalStorage from './useLocalStorage';

export default function UploadTapDataDialog({ scale, open, onClose }) {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('md'));

  const [feedback, setFeedback] = React.useState({ isOpen: false, message: '', severity: 'success' });
  const [volumeUnit, _] = useLocalStorage("tapVolumeUnit_" + scale.index, "L");
  const [uploadedData, setUploadedData] = React.useState(null);

  const onDrop = React.useCallback((acceptedFiles) => {
    acceptedFiles.forEach((file) => {
      const reader = new FileReader();
      reader.onabort = () => {
        setFeedback({ isOpen: true, message: 'File upload aborted!', severity: 'error' });
        setUploadedData(null);
      }
      reader.onerror = () => {
        setFeedback({ isOpen: true, message: 'Unable to read uploaded file!', severity: 'error' });
        setUploadedData(null);
      }
      reader.onload = () => {
        let parseResult;
        try {
          parseResult = JSON.parse(reader.result);
        } catch {
          setFeedback({ isOpen: true, message: 'Unable to parse uploaded file!', severity: 'error' });
          setUploadedData(null);
        }

        if (!parseResult.tapEntry || !parseResult.data) {
          setFeedback({ isOpen: true, message: 'Invalid file format!', severity: 'error' });
          setUploadedData(null);
        } else {
          setUploadedData(parseResult);
        }
      }
      reader.readAsText(file);
    });
  }, []);

  const {getRootProps, getInputProps} = useDropzone({
    onDrop,
    accept: {
      "application/json": [".keg.json"]
    },
    maxFiles: 1,
    maxSize: 1536,
    multiple: false
  });

  const handleRemoveFile = () => {
    setUploadedData(null);
  };

  const handleClose = () => {
    onClose();
    setUploadedData(null);
  };

  const handleUpload = () => {
    scale.putRecordingEntry(uploadedData)
      .then(() => {
        setFeedback({ isOpen: true, message: 'Recording entry uploaded!', severity: 'success' });
        onClose();
        setUploadedData(null);
      })
      .catch(() => {
        setFeedback({ isOpen: true, message: 'Uploading recording entry failed!', severity: 'error' });
      });
  };

  const handleFeedbackClose = () => {
    setFeedback({ ...feedback, isOpen: false });
  };

  return (
    <>
      <Dialog open={open} onClose={onClose} fullScreen={fullScreen} fullWidth maxWidth="md" scroll="body">
        <DialogTitle variant="h6" sx={{ flexGrow: 1 }}>
            <Typography variant="overline" noWrap paragraph mb={0}>{scale.label}</Typography>
            <Divider />
            Upload tap data
          </DialogTitle>
          <DialogContent>
            {!uploadedData && <div {...getRootProps({ className: "dropzone" })}>
              <input {...getInputProps()} />
              <p>Drag'n'drop your keg data file here, or click to select one.</p>
            </div>}
            {uploadedData &&
              <>
                <List>
                  <TapEntry entry={uploadedData.tapEntry}>
                    <Tooltip title="Remove file">
                      <IconButton onClick={handleRemoveFile}>
                        <CloseIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </TapEntry>
                </List>
                <TapChart
                  data={uploadedData.data}
                  isPaused={true}
                  tapEntry={uploadedData.tapEntry}
                  volumeUnit={volumeUnit}
                  height="50vh"
                  backroundColor="#3e3e3e" />
              </>}
          </DialogContent>
          <Divider />
          <DialogActions>
            <Button onClick={handleClose}>Cancel</Button>
            <Button onClick={handleUpload} disabled={!uploadedData}>Upload</Button>
          </DialogActions>
      </Dialog>
      <Snackbar open={feedback.isOpen} autoHideDuration={1000} onClose={handleFeedbackClose}>
        <Alert onClose={handleFeedbackClose} severity={feedback.severity}>
          {feedback.message}
        </Alert>
      </Snackbar>
    </>
  );
}
