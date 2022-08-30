import * as React from 'react';
import PropTypes from 'prop-types';
import { useTheme } from '@mui/material/styles';
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';

import ScaleIcon from '@mui/icons-material/Scale';
import PermDeviceInformationIcon from '@mui/icons-material/PermDeviceInformation';

import StatusPanel from './StatusPanel';
import ScalesPanel from './ScalesPanel';

function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      hidden={value !== index}
      id={`main-tabs-tabpanel-${index}`}
      {...other}
    >
      {value === index && (
        <Box>{children}</Box>
      )}
    </div>
  );
}

TabPanel.propTypes = {
  children: PropTypes.node,
  index: PropTypes.number.isRequired,
  value: PropTypes.number.isRequired,
};

export default function MainTabs() {
  const theme = useTheme();
  const [value, setValue] = React.useState(0);

  const handleChange = (event, newValue) => {
    setValue(newValue);
  };

  const handleChangeIndex = (index) => {
    setValue(index);
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
