import * as React from 'react';

import BalanceIcon from '@mui/icons-material/Balance';
import PowerSettingsNewIcon from '@mui/icons-material/PowerSettingsNew';
import SportsBarIcon from '@mui/icons-material/SportsBar';
import UploadIcon from '@mui/icons-material/Upload';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';

import ScaleToolbar from './ScaleToolbar';

export default function StandbyView({ scale, onUploadTapDataClick, onTapSetupClick }) {
  const handleLiveMeasurementClick = () => {
    scale.liveMeasurement();
  };

  return (
    <ScaleToolbar icon={PowerSettingsNewIcon} stateName="Standby">
      <Tooltip title="Upload tap data">
        <IconButton onClick={onUploadTapDataClick}>
          <UploadIcon />
        </IconButton>
      </Tooltip>
      <Tooltip title="Tap setup">
        <IconButton onClick={onTapSetupClick}>
          <SportsBarIcon />
        </IconButton>
      </Tooltip>
      <Tooltip title="Live measurement">
        <IconButton onClick={handleLiveMeasurementClick} edge="end">
          <BalanceIcon />
        </IconButton>
      </Tooltip>
    </ScaleToolbar>
  );
}
