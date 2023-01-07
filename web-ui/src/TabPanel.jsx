import * as React from 'react';
import Box from '@mui/material/Box';

export default function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div hidden={value !== index} {...other}>
      {value === index && (
        <Box>{children}</Box>
      )}
    </div>
  );
}
