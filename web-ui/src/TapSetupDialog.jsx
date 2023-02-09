import * as React from 'react';
import useFetch from "react-fetch-hook";
import createTrigger from "react-use-trigger";
import useTrigger from "react-use-trigger/useTrigger";

import apiLocation from './apiLocation';
import srmToRgb from './srmToRgb';

import useMediaQuery from '@mui/material/useMediaQuery';
import { createTheme, useTheme } from '@mui/material/styles';

import { Alert, Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, Divider, FormControlLabel, IconButton, List, ListItemButton, ListItemIcon, ListItemText, Snackbar, SvgIcon, Switch, ThemeProvider, Tooltip, Typography } from "@mui/material";
import { Stack } from '@mui/system';
import LaunchIcon from '@mui/icons-material/Launch';
import RefreshIcon from '@mui/icons-material/Refresh';

import TabPanel from './TabPanel';
import KnownWeights from './KnownWeights';

function ManualInputPanel(props) {
  return (
    <p>TODO implement manual input panel: name, abv, sg, bottling size, bottling date</p>
  );
}

function BeerIcon(props) {
  return (
    <Box sx={{ backgroundColor: "white", borderRadius: 1, width: "50px" }}>
      <SvgIcon {...props} sx={{ display: "block", width: "100%", height: "100%" }} viewBox="0 0 512 512">
        <path d="M64 48l42.9 379.2c2.6 20.8 20.5 36.8 42.5 36.8h213.3c22 0 39.9-16 42.5-36.8L448 48H64zm327 124.8H121l-9.4-83.2h288.6l-9.2 83.2z" />
      </SvgIcon>
    </Box>
  );
}

const catalogReloadTrigger = createTrigger();

function CatalogInputPanel(props) {
  const reload = useTrigger(catalogReloadTrigger);
  const { isLoading, data, error } = useFetch(apiLocation("/catalog"), { depends: [reload] });
  const [ selectedEntry, setSelectedEntry ] = React.useState(null);

  const BREWFATHER_BATCH_PREFIX = "https://web.brewfather.app/tabs/batches/batch/";

  const handleOpenExternalEntry = (e) => {
    e.stopPropagation();
    const url = BREWFATHER_BATCH_PREFIX + e.currentTarget.dataset.id;
    window.open(url, '_blank');
  };

  const handleEntrySelection = (e) => {
    const selectedIndex = e.currentTarget.dataset.index;
    if (selectedIndex >= 0 && selectedIndex < data.entries.length) {
      const original = data.entries[selectedIndex];
      const cloned = JSON.parse(JSON.stringify(original));
      setSelectedEntry(cloned);
      props.updateEntry(cloned);
    }
  }

  const MICROSECONDS_PER_DAY = 24 * 60 * 60 * 1000;
  const now = new Date();

  const theme = createTheme(useTheme(), {
    components: {
      MuiListItemButton: {
        styleOverrides: {
          root: {
            "&.Mui-selected": {
              backgroundColor: "rgba(255, 255, 255, 0.16)"
            },
            "&.Mui-selected:hover": {
              backgroundColor: "rgba(255, 255, 255, 0.24)"
            }
          }
        }
      }
    }
  });

  // TODO add option to rename an item after selected
  return (
    <ThemeProvider theme={theme}>
      <List>
        {data && data.entries && data.entries.sort((a, b) => a.number < b.number).map((entry, index) => {
          return (
            <ListItemButton
              selected={selectedEntry && selectedEntry.id == entry.id}
              onClick={handleEntrySelection}
              key={"catalog_entry_" + index}
              data-index={index}
              divider={true}>
              <ListItemIcon>
                <BeerIcon htmlColor={srmToRgb(entry.srm)} />
              </ListItemIcon>
              <ListItemText>
                <Typography variant="subtitle1" ml={1}>
                  <strong>#{entry.number}</strong>&nbsp;{entry.name}
                  <Tooltip title="Open external entry">
                    <IconButton onClick={handleOpenExternalEntry} data-id={entry.id} sx={{ ml: 1 }}>
                      <LaunchIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Typography>
                <Stack divider={<Divider orientation="vertical" flexItem />} direction="row" sx={{ color: "text.secondary" }}>
                  <Typography mx={1} variant="body2">{entry.abv.toFixed(1)}%</Typography>
                  <Typography mx={1} variant="body2">{entry.bottlingSize.toFixed(1)} L</Typography>
                  <Typography mx={1} variant="body2">{Math.round(entry.finalGravity)} g/L</Typography>
                  <Typography mx={1} variant="body2">{Math.floor((now - new Date(entry.bottlingDate)) / MICROSECONDS_PER_DAY)} days</Typography>
              </Stack>
              </ListItemText>
            </ListItemButton>
          );
        })}
      </List>
    </ThemeProvider>
  );
}

export default function TapSetupDialog(props) {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('md'));
  const [useCatalog, setUseCatalog] = React.useState(true);
  const [feedback, setFeedback] = React.useState({ isOpen: false, message: '', severity: 'success' });
  const [entry, setEntry] = React.useState({});

  const handleUseCatalogChange = (e) => {
    setUseCatalog(e.currentTarget.checked);
  };

  const handleCatalogRefresh = () => {
    fetch(apiLocation("/catalog/update"), { method: "POST" }).then((response) => {
      if (response.ok) {
        setFeedback({ isOpen: true, message: 'Catalog update complete!', severity: 'success' });
        catalogReloadTrigger();
      } else {
        setFeedback({ isOpen: true, message: 'Catalog update failed!', severity: 'error' });
      }
    })
  };

  const handleFeedbackClose = () => {
    setFeedback({ ...feedback, isOpen: false });
  };

  const handleUpdateEntry = (entry) => {
    setEntry(entry);
    // TODO set selected mass on entry
  }

  const handleKnownWeight = (mass) => {
    entry.tareOffset = mass;
    setEntry(entry);
  }

  const handleStart = () => {
    // TODO start recording
  };

  // TODO disable start until entry is ready
  return (
    <>
      <Dialog open={props.open} onClose={props.onClose} fullScreen={fullScreen} fullWidth={true} maxWidth="md" scroll="body">
        <DialogTitle variant="h6" sx={{ flexGrow: 1 }}>
            <Typography variant="overline" noWrap paragraph mb={0}>{props.label}</Typography>
            <Divider />
            Tap setup
          </DialogTitle>
          <DialogContent>
            <Stack direction="row">
              <FormControlLabel control={<Switch checked={useCatalog} onChange={handleUseCatalogChange} />} label="Use catalog" />
              <div style={{flex: '1 0 0'}} />
              {useCatalog &&
                <Tooltip title="Refresh">
                  <IconButton onClick={handleCatalogRefresh}>
                    <RefreshIcon />
                  </IconButton>
                </Tooltip>}
            </Stack>
            <Divider />
            <TabPanel value={useCatalog} index={true}>
              <CatalogInputPanel reloadTrigger={catalogReloadTrigger} updateEntry={handleUpdateEntry} />
            </TabPanel>
            <TabPanel value={useCatalog} index={false}>
              <ManualInputPanel />
            </TabPanel>
            <KnownWeights isToggle={true} weights={props.weights} forTare={true} onClick={handleKnownWeight} />
          </DialogContent>
          <DialogActions>
            <Button onClick={props.onClose}>Cancel</Button>
            <Button onClick={handleStart}>Start</Button>
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
