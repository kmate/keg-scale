import * as React from 'react';
import { Divider, Stack, Typography } from "@mui/material";

function PropertyLabel({ children }) {
  return <Typography mx={1} variant="body2" color="text.secondary">{children}</Typography>;
}

export default function TapEntryProperties({ entry, children, ...props }) {

  const MICROSECONDS_PER_DAY = 24 * 60 * 60 * 1000;
  const now = new Date();

  return (
    <Stack
      alignItems="center"
      direction="row"
      divider={<Divider orientation="vertical" flexItem />}
      {...props}>
        <PropertyLabel>{entry.abv.toFixed(1)}%</PropertyLabel>
        <PropertyLabel>{entry.bottlingVolume.toFixed(1)} L</PropertyLabel>
        <PropertyLabel>{Math.round(entry.finalGravity)} g/L</PropertyLabel>
        <PropertyLabel>{Math.floor((now - new Date(entry.bottlingDate)) / MICROSECONDS_PER_DAY)} days</PropertyLabel>
        {children}
    </Stack>
  );
}
