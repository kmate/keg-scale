import * as React from 'react';
import createTrigger from "react-use-trigger";

import apiLocation from './apiLocation';

import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme } from '@mui/material/styles';

import { Alert, Button, Dialog, DialogActions, DialogContent, DialogTitle, Divider, FormControlLabel, IconButton, Snackbar, Switch, TextField, Tooltip, Typography } from "@mui/material";
import { Stack } from '@mui/system';
import RefreshIcon from '@mui/icons-material/Refresh';

import KnownWeights from './KnownWeights';
import CatalogInputPanel from './CatalogInputPanel';

function EntryInputPanel(props) {
  return (
    <Stack direction="column">
      <TextField
        label="Name"
        variant="outlined" /> { /* TODO the outlined variant might not be the best for this form? */ }
      <TextField
        sx={{input: {textAlign: 'right'}}}
        label="ABV"
        variant="outlined" /> { /* TODO add unit designation % V/V */ }
      <TextField
        sx={{input: {textAlign: 'right'}}}
        label="Density"
        variant="outlined" /> { /* TODO add unit - separate control from LiveMeasurement? */ }
      <TextField
        sx={{input: {textAlign: 'right'}}}
        label="Bottling size"
        variant="outlined" /> { /* TODO add unit selector */ }
      <TextField
        sx={{input: {textAlign: 'right'}}}
        label="Bottling date"
        variant="outlined" /> { /* TODO change to calendar day select */ }
    </Stack>
  );
}

const catalogRefreshTrigger = createTrigger();

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
        catalogRefreshTrigger();
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
  }

  const handleKnownWeight = (mass) => {
    entry.tareOffset = mass;
    setEntry(entry);
  }

  const handleStart = () => {
    // TODO start recording
    console.log(entry);
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
            {useCatalog && <CatalogInputPanel updateEntry={handleUpdateEntry} catalogRefreshTrigger={catalogRefreshTrigger} />}
            <EntryInputPanel entry={entry} updateEntry={handleUpdateEntry} />
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
