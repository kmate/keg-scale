import * as React from 'react';
import useFetch from "react-fetch-hook";
import formatBytes from './formatBytes';

import { Divider, List, ListItem, ListItemIcon, ListItemText } from '@mui/material';
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

const fromUTCDateTime = (dt) => new Date(dt + "Z").toLocaleString();

const stats = {
  "compiledAt": {
    label: "Compiled at",
    show: fromUTCDateTime
  },
  "currentTime": {
    label: "Current time",
    show: fromUTCDateTime
  },
  "ssid": {
    label: "SSID",
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
                    <ListItem sx={{ pl: 4 }}>
                      <ListItemText primary={stats[stat].label} secondary={stats[stat].show(props.data[group][stat])} />
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