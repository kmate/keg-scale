import * as React from 'react';

import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Typography from '@mui/material/Typography';
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
