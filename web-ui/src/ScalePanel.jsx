import * as React from 'react';

import Box from '@mui/material/Box';
import Divider from '@mui/material/Divider';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import CalibrationDialog from './CalibrationDialog';
import LiveMeasurementView from './LiveMeasurementView';
import OfflineView from './OfflineView';
import RecordingView from './RecordingView';
import StandbyView from './StandbyView';
import TabPanel from './TabPanel';
import TapSetupDialog from './TapSetupDialog';
import UploadTapDataDialog from './UploadTapDataDialog';

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
