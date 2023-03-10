import * as React from 'react';
import useFetch from "react-fetch-hook";
import useTrigger from "react-use-trigger/useTrigger";

import apiLocation from './apiLocation';
import srmToRgb from './srmToRgb';

import { createTheme, useTheme } from '@mui/material/styles';

import { Box, Divider, IconButton, List, ListItemButton, ListItemIcon, ListItemText, SvgIcon, ThemeProvider, Tooltip, Typography } from "@mui/material";
import { Stack } from '@mui/system';
import LaunchIcon from '@mui/icons-material/Launch';

function BeerIcon(props) {
  return (
    <Box sx={{ backgroundColor: "white", borderRadius: 1, width: "50px" }}>
      <SvgIcon {...props} sx={{ display: "block", width: "100%", height: "100%" }} viewBox="0 0 512 512">
        <path d="M64 48l42.9 379.2c2.6 20.8 20.5 36.8 42.5 36.8h213.3c22 0 39.9-16 42.5-36.8L448 48H64zm327 124.8H121l-9.4-83.2h288.6l-9.2 83.2z" />
      </SvgIcon>
    </Box>
  );
}

export default function CatalogInputPanel({ catalogRefreshTrigger, updateEntry }) {
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
      const cloned = JSON.parse(JSON.stringify(original));
      setSelectedEntry(cloned);
      updateEntry(cloned);
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
