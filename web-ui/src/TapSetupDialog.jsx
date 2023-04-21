import * as React from 'react';
import createTrigger from "react-use-trigger";

import apiLocation from './apiLocation';

import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme } from '@mui/material/styles';

import { Alert, Button, Dialog, DialogActions, DialogContent, DialogTitle, Divider, FormControlLabel, IconButton, Snackbar, Switch, Tooltip, Typography } from "@mui/material";
import { Stack } from '@mui/system';
import RefreshIcon from '@mui/icons-material/Refresh';

import CatalogInputPanel from './CatalogInputPanel';
import EntryInputPanel from './EntryInputPanel';
import dayjs from 'dayjs';

const catalogRefreshTrigger = createTrigger();

const defaultEntry = {
  id: null,
  name: "",
  abv: 5,
  finalGravity: 1010,
  srm: 9,
  bottlingSize: 19,
  bottlingDate: dayjs(),
  isValid: false
}

export default function TapSetupDialog({ scale, weights, open, onClose }) {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('md'));
  const [useCatalog, setUseCatalog] = React.useState(true);
  const [feedback, setFeedback] = React.useState({ isOpen: false, message: '', severity: 'success' });
  const [entry, setEntry] = React.useState(defaultEntry);

  React.useEffect(() => {
    setEntry({ ...defaultEntry });
  }, [open])

  const handleUseCatalogChange = (e) => {
    const newUseCatalog = e.currentTarget.checked;
    setUseCatalog(newUseCatalog);
    if (!newUseCatalog) {
      entry.id = null;
    }
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

  const handleStart = () => {
    const payload = { ...entry };
    delete payload.isValid;
    payload.bottlingDate = payload.bottlingDate.format("YYYY-MM-DD");

    scale.startRecording(payload)
      .then(() => setFeedback({ isOpen: true, message: 'Recording started!', severity: 'success' }))
      .catch(() => setFeedback({ isOpen: true, message: 'Failed to start recording!', severity: 'error' }));
  };

  return (
    <>
      <Dialog open={open} onClose={onClose} fullScreen={fullScreen} fullWidth maxWidth="md" scroll="body">
        <DialogTitle variant="h6" sx={{ flexGrow: 1 }}>
            <Typography variant="overline" noWrap paragraph mb={0}>{scale.label}</Typography>
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
            {useCatalog && <CatalogInputPanel onEntryChange={setEntry} catalogRefreshTrigger={catalogRefreshTrigger} />}
            <EntryInputPanel weights={weights} entry={entry} onEntryChange={setEntry} />
          </DialogContent>
          <Divider />
          <DialogActions>
            <Button onClick={onClose}>Cancel</Button>
            <Button onClick={handleStart} disabled={!entry.isValid}>Start</Button>
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
