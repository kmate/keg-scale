import * as React from 'react';
import useFetch from "react-fetch-hook";
import { useLongPress } from 'use-long-press';
import copy from "copy-to-clipboard";
import formatBytes from './formatBytes';

import { Divider, List, ListItem, ListItemButton, ListItemIcon, ListItemText, Tooltip } from '@mui/material';
import LoadingIndicator from './LoadingIndicator';

import BuildIcon from '@mui/icons-material/Build';
import WifiIcon from '@mui/icons-material/Wifi';
import DeveloperBoardIcon from '@mui/icons-material/DeveloperBoard';

const groups = {
  "general": {
    label: "General",
    icon: BuildIcon
  },
  "wifi": {
    label: "WiFi",
    icon: WifiIcon
  },
  "esp": {
    label: "ESP",
    icon: DeveloperBoardIcon
  },
};

const identity = (x) => x;

const fromDateTime = (dt) => new Date(dt).toLocaleString();

const fromUTCDateTime = (dt) => new Date(dt.replace(" ", "T") + "Z").toLocaleString();

const stats = {
  "compiledAt": {
    label: "Compiled at",
    // compilation date is expected to be in the same time zone as the user's device
    show: fromDateTime
  },
  "currentTime": {
    label: "Current time",
    show: fromUTCDateTime
  },
  "ssid": {
    label: "SSID",
    show: identity
  },
  "ip": {
    label: "IP address",
    show: identity
  },
  "chipId": {
    label: "Chip ID",
    show: identity
  },
  "flashChipId": {
    label: "Flash chip ID",
    show: identity
  },
  "coreVersion": {
    label: "Arduino core version",
    show: identity
  },
  "sdkVersion": {
    label: "SDK version",
    show: identity
  },
  "cpuFreqMHz": {
    label: "CPU frequency",
    show: (f) => f + " MHz"
  },
  "sketchSize": {
    label: "Sketch size",
    show: formatBytes
  },
  "freeSketchSpace": {
    label: "Free sketch space",
    show: formatBytes
  },
  "freeHeap": {
    label: "Free heap",
    show: formatBytes
  },
  "heapFragmentation": {
    label: "Heap fragmentation",
    show: (p) => p + "%"
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

export default function StatusPanel() {

  const { isLoading, data, error } = useFetch("http://keg-scale.local/status");

  return(
    <>
      { isLoading ? <LoadingIndicator /> : <StatusContents data={data} />}
    </>
  );
}