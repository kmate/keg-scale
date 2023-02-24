import * as React from 'react';
import { useTheme } from '@mui/material/styles';
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';

import ScaleIcon from '@mui/icons-material/Scale';
import PermDeviceInformationIcon from '@mui/icons-material/PermDeviceInformation';

import TabPanel from './TabPanel';
import StatusPanel from './StatusPanel';
import ScalesPanel from './ScalesPanel';
import useLocalStorage from './useLocalStorage';
import apiLocation from './apiLocation';

export default function MainTabs() {
  const theme = useTheme();
  const [value, setValue] = React.useState(0);
  const [debugLog, setDebugLog] = useLocalStorage('debugLog', false);

  const handleChange = (_, newValue) => {
    setValue(newValue);
  };

  const logReconnectSeconds = 5;
  const logSocket = React.useRef(null);

  const connectLogSocket = () => {
    console.info('Trying to connect log socket...');
    const newSocket = new WebSocket(apiLocation('/log').replace(/^http/, 'ws'));

    const connectTimeout = setTimeout(() => {
      console.warn('Log socket connection timed out.');
      newSocket.close();
    }, logReconnectSeconds * 1000);

    newSocket.onopen = () => {
      clearTimeout(connectTimeout);
    };

    newSocket.onerror = (e) => {
      console.warn('Log socket error.', e);
    };

    newSocket.onclose = () => {
      clearTimeout(connectTimeout);
      console.warn('Log socket disconnected.');
      setTimeout(connectLogSocket, logReconnectSeconds * 1000);
    }

    newSocket.onmessage = e => {
      console.debug(`[${new Date().toLocaleString()}] ${e.data}`);
    };

    logSocket.current = newSocket;
  }

  React.useEffect(() => {
    if (debugLog) {
      connectLogSocket();

      const currentLogSocket = logSocket.current;

      return () => {
        currentLogSocket.onclose = null;
        currentLogSocket.close();
        console.info('Log socket closed.');
      };
    }
  }, [debugLog]);

  return (
    <Box sx={{ bgcolor: 'background.paper' }}>
      <AppBar position="static">
        <Tabs
          value={value}
          onChange={handleChange}
          indicatorColor="primary"
          textColor="inherit"
          variant="fullWidth"
        >
          <Tab label="Scales" icon={<ScaleIcon />} iconPosition="start" />
          <Tab label="Status" icon={<PermDeviceInformationIcon />} iconPosition="start" />
        </Tabs>
      </AppBar>
      <TabPanel value={value} index={0} dir={theme.direction}>
        <ScalesPanel />
      </TabPanel>
      <TabPanel value={value} index={1} dir={theme.direction}>
        <StatusPanel debugLog={debugLog} setDebugLog={setDebugLog} />
      </TabPanel>
    </Box>
  );
}
