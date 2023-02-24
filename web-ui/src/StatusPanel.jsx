import * as React from 'react';
import useFetch from "react-fetch-hook";
import { useLongPress } from 'use-long-press';
import copy from "copy-to-clipboard";
import apiLocation from './apiLocation';
import formatBytes from './formatBytes';

import { Divider, FormControlLabel, List, ListItem, ListItemButton, ListItemIcon, ListItemText, Stack, Switch, Tooltip } from '@mui/material';
import ErrorIndicator from './ErrorIndicator';
import LoadingIndicator from './LoadingIndicator';

import BuildIcon from '@mui/icons-material/Build';
import WifiIcon from '@mui/icons-material/Wifi';
import MemoryIcon from '@mui/icons-material/Memory';
import DeveloperBoardIcon from '@mui/icons-material/DeveloperBoard';

const groups = {
  general: {
    label: "General",
    icon: BuildIcon
  },
  wifi: {
    label: "WiFi",
    icon: WifiIcon
  },
  eeprom: {
    label: "EEPROM",
    icon: MemoryIcon
  },
  esp: {
    label: "ESP",
    icon: DeveloperBoardIcon
  },
};

const identity = (x) => x;

const fromDateTime = (dt) => new Date(dt).toLocaleString();

const fromUTCDateTime = (dt) => new Date(dt.replace(" ", "T") + "Z").toLocaleString();

const integerPercentage = (p) => p + "%";

const stats = {
  compiledAt: {
    label: "Compiled at",
    // compilation date is expected to be in the same time zone as the user's device
    show: fromDateTime
  },
  currentTime: {
    label: "Current time",
    show: fromUTCDateTime
  },
  bootTime: {
    label: "Boot time",
    show: fromUTCDateTime
  },
  ssid: {
    label: "SSID",
    show: identity
  },
  ip: {
    label: "IP address",
    show: identity
  },
  percentUsed: {
    label: "Space used",
    show: integerPercentage
  },
  chipId: {
    label: "Chip ID",
    show: identity
  },
  flashChipId: {
    label: "Flash chip ID",
    show: identity
  },
  coreVersion: {
    label: "Arduino core version",
    show: identity
  },
  sdkVersion: {
    label: "SDK version",
    show: identity
  },
  cpuFreqMHz: {
    label: "CPU frequency",
    show: (f) => f + " MHz"
  },
  sketchSize: {
    label: "Sketch size",
    show: formatBytes
  },
  freeSketchSpace: {
    label: "Free sketch space",
    show: formatBytes
  },
  freeDramHeap: {
    label: "Free DRAM heap",
    show: formatBytes
  },
  dramHeapFragmentation: {
    label: "DRAM heap fragmentation",
    show: integerPercentage
  },
  freeIramHeap: {
    label: "Free IRAM heap",
    show: formatBytes
  },
  iramHeapFragmentation: {
    label: "IRAM heap fragmentation",
    show: integerPercentage
  },
}

function ListItemCopyButton(props) {
  const [showCopyDone, setShowCopyDone] = React.useState(false);

  const handleItemLongPress = useLongPress((e) => {
    copy(e.target.parentElement.innerText);
    setShowCopyDone(true);
    setTimeout(() => setShowCopyDone(false), 1000);
  });

  return (
    <Tooltip open={showCopyDone} title="Copied to clipboard!" placement="top" arrow>
      <ListItemButton {...handleItemLongPress()} {...props}>
        {props.children}
      </ListItemButton>
    </Tooltip>
  );
}

function StatusContents(props) {
  return (
    <List>
      {Object.keys(props.data).map((group) => {
        const Icon = groups[group].icon;
        return (
          <React.Fragment key={group}>
            <ListItem>
              <ListItemIcon sx={{ minWidth: "36px" }}>{<Icon />}</ListItemIcon>
              <ListItemText primary={groups[group].label} />
            </ListItem>
            <Divider />
            <List component="div" disablePadding>
              {Object.keys(props.data[group]).map((stat) => {
                const Icon = stats[stat].icon;
                return (
                  <React.Fragment key={group + "." + stat}>
                    <ListItem disablePadding>
                      <ListItemCopyButton sx={{ pl: 4 }}>
                        <ListItemText
                          primary={stats[stat].label}
                          secondary={stats[stat].show(props.data[group][stat])}
                        />
                      </ListItemCopyButton>
                    </ListItem>
                    <Divider />
                  </React.Fragment>
                );
              })}
            </List>
          </React.Fragment>
        );
      })}
    </List>
  );
}

export default function StatusPanel({ debugLog, setDebugLog }) {

  const { isLoading, data, error } = useFetch(apiLocation("/status"));

  const handleDebugLogChange = (e) => {
    setDebugLog(e.currentTarget.checked);
  }

  return(
    <Stack>
      <FormControlLabel
        control={<Switch checked={debugLog} onChange={handleDebugLogChange} />}
        label="Debug log"
        sx={{m: 1}} />
      <Divider />
      { isLoading ? <LoadingIndicator /> : (error ? <ErrorIndicator error={error} /> : <StatusContents data={data} />)}
    </Stack>
  );
}
