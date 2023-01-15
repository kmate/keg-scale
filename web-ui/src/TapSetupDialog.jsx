import * as React from 'react';
import useFetch from "react-fetch-hook";
import useInterval from 'use-interval';
import apiLocation from './apiLocation';
import srmToRgb from './srmToRgb';

import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme } from '@mui/material/styles';

import { Alert, Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, Divider, FormControl, FormControlLabel, List, ListItemButton, ListItemIcon, ListItemText, MenuItem, Select, Snackbar, Switch, TextField, Typography } from "@mui/material";
import { Stack } from '@mui/system';
import TabPanel from './TabPanel';
import LocalDrinkIcon from '@mui/icons-material/LocalDrink';

function ManualInputPanel(props) {
  return (<p>TODO implement manual input panel</p>);
}

function CatalogInputPanel(props) {
  const { isLoading, data, error } = useFetch(apiLocation("/catalog"));

  return (
    <>
      <Typography>TODO finish catalog input panel</Typography>
      <List>
        {data && data.entries && data.entries.map((entry, index) => {
          return (
            <ListItemButton divider={true} key={"catalog_entry_" + index}>
              <ListItemIcon>
                <Box sx={{ backgroundColor: "white", p: 1 }} >
                  <LocalDrinkIcon htmlColor={srmToRgb(entry.srm)} />
                </Box>
              </ListItemIcon>
              <ListItemText>
                <Typography variant="subtitle1">{entry.name}</Typography>
                {entry.abv.toFixed(1)}%<br/>
                #{entry.number}<br/>
                {entry.brewDate}<br/>
                {entry.bottlingSize.toFixed(1)} L<br/>
                {(entry.finalGravity /1000).toFixed(3)} g/L<br/>
              </ListItemText>
            </ListItemButton>
          );
        })}
      </List>
    </>
  );
}

export default function TapSetupDialog(props) {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('md'));
  const [useManualInput, setUseManualInput] = React.useState(false);

  const handleManualInputChange = (event) => {
    setUseManualInput(event.target.checked);
  };

  const handleStart = () => {
    // TODO start recording
  };

  return (
    <Dialog open={props.open} onClose={props.onClose} fullScreen={fullScreen} scroll="body">
      <DialogTitle variant="h6" sx={{ flexGrow: 1 }}>
          <Typography variant="overline" noWrap paragraph mb={0}>{props.label}</Typography>
          <Divider />
          Tap setup
        </DialogTitle>
        <DialogContent>
          <FormControlLabel control={<Switch checked={useManualInput} onChange={handleManualInputChange} />} label="Manual input" />
          <Divider />
          <TabPanel value={useManualInput} index={true}>
            <ManualInputPanel />
          </TabPanel>
          <TabPanel value={useManualInput} index={false}>
          <CatalogInputPanel />
          </TabPanel>
        <DialogActions>
          <Button onClick={props.onClose}>Cancel</Button>
          <Button onClick={handleStart}>Start</Button>
        </DialogActions>
        </DialogContent>
    </Dialog>
  );
}
