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

export default function MainTabs() {
  const theme = useTheme();
  const [value, setValue] = React.useState(0);

  const handleChange = (_, newValue) => {
    setValue(newValue);
  };

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
        <StatusPanel />
      </TabPanel>
    </Box>
  );
}
