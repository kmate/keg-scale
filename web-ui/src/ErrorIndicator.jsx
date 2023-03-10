import * as React from 'react';
import Alert from '@mui/material/Alert';

export default function ErrorIndicator({ error }) {
  return <Alert severity="error">Error: {JSON.stringify(error)}</Alert>;
}
