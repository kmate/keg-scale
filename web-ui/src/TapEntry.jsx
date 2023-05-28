import * as React from 'react';

import { ListItemButton, ListItemIcon, ListItemText, Typography } from '@mui/material';
import BeerIcon from './BeerIcon';
import srmToRgb from './srmToRgb';
import TapEntryProperties from './TapEntryProperties';

export default function TapEntry({ entry, children, ...props }) {

  return (
    <ListItemButton {...props}>
      <ListItemIcon>
        <BeerIcon color={srmToRgb(entry.srm)} />
      </ListItemIcon>
      <ListItemText disableTypography={true}>
        <Typography variant="subtitle1" ml={1}>
          <strong>#{entry.number}</strong>&nbsp;{entry.name}
        </Typography>
        <TapEntryProperties entry={entry} />
      </ListItemText>
      {children}
    </ListItemButton>
  );
}
