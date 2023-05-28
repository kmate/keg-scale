import * as React from 'react';
import useFetch from "react-fetch-hook";
import useTrigger from "react-use-trigger/useTrigger";

import { IconButton, List, ThemeProvider, Tooltip } from "@mui/material";
import { createTheme, useTheme } from '@mui/material/styles';
import LaunchIcon from '@mui/icons-material/Launch';
import dayjs from 'dayjs';
import apiLocation from './apiLocation';
import TapEntry from './TapEntry';

export default function CatalogInputPanel({ catalogRefreshTrigger, onEntryChange }) {
  const refresh = useTrigger(catalogRefreshTrigger);
  const { isLoading, data, error } = useFetch(apiLocation("/catalog"), { depends: [refresh] });
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

      const cloned = selectedEntry && selectedEntry.id == original.id
        ? { ...selectedEntry, id: null, number: null }
        : { ...original, bottlingDate: dayjs(original.bottlingDate), useBottlingVolume: true };
      cloned.isValid = true;

      setSelectedEntry(cloned);
      onEntryChange(cloned);
    }
  }

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

  return (
    <ThemeProvider theme={theme}>
      <List>
        {data && data.entries && data.entries.sort((a, b) => b.number - a.number).map((entry, index) => {
          return (
            <TapEntry
              entry={entry}
              handleOpenExternalEntry={handleOpenExternalEntry}
              selected={selectedEntry && selectedEntry.id == entry.id}
              onClick={handleEntrySelection}
              key={"catalog_entry_" + index}
              data-index={index}
              divider>
                <Tooltip title="Open external entry">
                  <IconButton onClick={handleOpenExternalEntry} data-id={entry.id}>
                    <LaunchIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </TapEntry>
          );
        })}
      </List>
    </ThemeProvider>
  );
}
