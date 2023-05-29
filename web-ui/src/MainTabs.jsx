import * as React from 'react';
import ReconnectingWebSocket from 'reconnecting-websocket';

import useTheme from '@mui/material/styles/useTheme';
import AppBar from '@mui/material/AppBar';
import Stack from '@mui/material/Stack';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';

import ScaleIcon from '@mui/icons-material/Scale';
import PermDeviceInformationIcon from '@mui/icons-material/PermDeviceInformation';

import TabPanel from './TabPanel';
import StatusPanel from './StatusPanel';
import ScalesPanel from './ScalesPanel';
import useLocalStorage from './useLocalStorage';
import apiLocation from './apiLocation';
import { useMock } from './mock';

export default function MainTabs() {
  const theme = useTheme();
  const [value, setValue] = React.useState(0);
  const [debugLog, setDebugLog] = useLocalStorage('debugLog', false);

  const handleChange = (_, newValue) => {
    setValue(newValue);
  };

  React.useEffect(() => {
    if (debugLog && !useMock()) {
      console.info('Opening log socket...');
      const logSocket = new ReconnectingWebSocket(apiLocation('/log').replace(/^http/, 'ws'));

      logSocket.onerror = (e) => {
        console.warn('Log socket error.', e);
      };

      logSocket.onmessage = e => {
        console.debug(`[${new Date().toLocaleString()}] ${e.data}`);
      };

      return () => {
        logSocket.close();
        console.info('Log socket closed.');
      };
    }
  }, [debugLog]);

  return (
    <Stack direction="column" height={1}>
      <AppBar position="static">
        <Tabs
          value={value}
          onChange={handleChange}
          indicatorColor="primary"
          textColor="inherit"
          variant="fullWidth">
          <Tab label="Scales" icon={<ScaleIcon />} iconPosition="start" />
          <Tab label="Status" icon={<PermDeviceInformationIcon />} iconPosition="start" />
        </Tabs>
      </AppBar>
      <TabPanel value={value} index={0} dir={theme.direction} className="scales-tab-panel">
        <ScalesPanel />
      </TabPanel>
      <TabPanel value={value} index={1} dir={theme.direction}>
        <StatusPanel debugLog={debugLog} setDebugLog={setDebugLog} />
      </TabPanel>
    </Stack>
  );
}
