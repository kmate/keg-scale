import * as React from 'react';
import Alert from '@mui/material/Alert';

export default function ErrorIndicator(props) {
  return <Alert severity="error">Error: {JSON.stringify(props.error)}</Alert>;
}