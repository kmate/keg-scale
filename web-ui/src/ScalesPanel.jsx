import * as React from 'react';
import useFetch from "react-fetch-hook";
import ReconnectingWebSocket from 'reconnecting-websocket';

import { Box, Grid } from '@mui/material';

import apiLocation from './apiLocation';
import ErrorIndicator from './ErrorIndicator';
import LoadingIndicator from './LoadingIndicator';
import ScalePanel from './ScalePanel';

function ScalePanelGrid({ scales, weights }) {

  const [scaleData, setScaleData] = React.useState([]);

  React.useEffect(() => {
    console.info('Opening scales socket...');
    const scalesSocket = new ReconnectingWebSocket(apiLocation('/scales').replace(/^http/, 'ws'));

    scalesSocket.onerror = (e) => {
      console.warn('Scales socket error.', e);
    };

    scalesSocket.onmessage = e => {
      setScaleData((scaleData) => {
        const payload = JSON.parse(e.data);
        const newScaleData = [...scaleData];
        newScaleData[payload.index] = payload;
        return newScaleData;
      });
    };

    return () => {
      scalesSocket.close();
      console.info('Scales socket closed.');
    };
  }, [scales, weights]);

  return (
    <Box sx={{ flexGrow: 1, p: 1 }}>
      <Grid container columns={2} spacing={1}>
        {scales.map((scale, index) => {
          return (
            <Grid item key={"scale_" + index} xs={2} md={1}>
              <ScalePanel label={scale.label} data={scaleData[index]} weights={weights} index={index} />
            </Grid>
          );
        })}
      </Grid>
    </Box>
  );
}

export default function ScalesPanel() {

  const { isLoading, data, error } = useFetch(apiLocation("/config"));

  return(
    <>
      { isLoading
        ? <LoadingIndicator />
        : (error
          ? <ErrorIndicator error={error} />
          : <ScalePanelGrid scales={data.scales} weights={data.weights} />)}
    </>
  );
}
