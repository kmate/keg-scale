import * as React from 'react';

import CloudOffIcon from '@mui/icons-material/CloudOff';

import ScaleToolbar from './ScaleToolbar';

export default function OfflineView() {
  return <ScaleToolbar icon={CloudOffIcon} stateName="Offline" />;
}
