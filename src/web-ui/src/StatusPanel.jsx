import * as React from 'react';
import useFetch from "react-fetch-hook";
import { useLongPress } from 'use-long-press';
import copy from "copy-to-clipboard";
import apiLocation from './apiLocation';
import formatBytes from './formatBytes';

import Divider from '@mui/material/Divider';
import FormControlLabel from '@mui/material/FormControlLabel';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Stack from '@mui/material/Stack';
import Switch from '@mui/material/Switch';
import Tooltip from '@mui/material/Tooltip';
import ErrorIndicator from './ErrorIndicator';
import LoadingIndicator from './LoadingIndicator';

import BuildIcon from '@mui/icons-material/Build';
import DeveloperBoardIcon from '@mui/icons-material/DeveloperBoard';
import MemoryIcon from '@mui/icons-material/Memory';
import SdCardIcon from '@mui/icons-material/SdCard';
import StorageIcon from '@mui/icons-material/Storage';
import WifiIcon from '@mui/icons-material/Wifi';

const groups = {
  general: {
    label: "General",
    icon: BuildIcon
  },
  wifi: {
    label: "WiFi",
    icon: WifiIcon
  },
  heap: {
    label: "Heap",
    icon: MemoryIcon
  },
  fs: {
    label: "File system",
    icon: StorageIcon
  },
  eeprom: {
    label: "EEPROM",
    icon: SdCardIcon
  },
  esp: {
    label: "ESP",
    icon: DeveloperBoardIcon
  },
};

const identity = (x) => x;

const fromUTCDateTime = (dt) => new Date(dt.replace(" ", "T") + "Z").toLocaleString();

const fromHTTPDateTime = (dt) => new Date(dt).toLocaleString();

const integerPercentage = (p) => p + "%";

const stats = {
  compiledAt: {
    label: "Compiled at",
    show: fromUTCDateTime
  },
  fsLastModified: {
    label: "File system last modified",
    show: fromHTTPDateTime
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
  totalBytes: {
    label: "Total bytes",
    show: formatBytes
  },
  freeBytes: {
    label: "Free bytes",
    show: formatBytes
  },
  blockSize: {
    label: "Block size",
    show: formatBytes
  },
  pageSize: {
    label: "Page size",
    show: formatBytes
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

function StatusContents({ data }) {
  return (
    <List>
      {Object.keys(data).map((group) => {
        const Icon = groups[group].icon;
        return (
          <React.Fragment key={group}>
            <ListItem>
              <ListItemIcon sx={{ minWidth: "36px" }}>{<Icon />}</ListItemIcon>
              <ListItemText primary={groups[group].label} />
            </ListItem>
            <Divider />
            <List component="div" disablePadding>
              {Object.keys(data[group]).map((stat) => {
                return (
                  <React.Fragment key={group + "." + stat}>
                    <ListItem disablePadding>
                      <ListItemCopyButton sx={{ pl: 4 }}>
                        <ListItemText
                          primary={stats[stat].label}
                          secondary={stats[stat].show(data[group][stat])}
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
