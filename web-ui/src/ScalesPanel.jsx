import * as React from 'react';
import useFetch from "react-fetch-hook";
import merge from 'lodash.merge';

import { Box, Grid } from '@mui/material';

import apiLocation from './apiLocation';
import ErrorIndicator from './ErrorIndicator';
import LoadingIndicator from './LoadingIndicator';
import ScalePanel from './ScalePanel';
import Scales from './scales';

function ScalePanelGrid({ scaleConfig, weights }) {

  const [scaleData, setScaleData] = React.useState([]);
  const [scales, _] = React.useState(() => {
    return new Scales(
      apiLocation('/scales').replace(/^http/, 'ws'),
      scaleConfig,
      (payload) => {
        setScaleData((scaleData) => {
          const newScaleData = [...scaleData];
          if (payload.isFull) {
            newScaleData[payload.index] = payload;
          } else {
            merge(newScaleData[payload.index], payload);
          }
          return newScaleData;
        });
      }
    )
  });

  React.useEffect(() => {
    scales.open();
    return () => {
      scales.close();
    };
  }, [scaleConfig]);

  return (
    <Box sx={{ flexGrow: 1, p: 1 }}>
      <Grid container columns={2} spacing={1}>
        {scales.instances.map((scale, index) => {
          return (
            <Grid item key={"scale_" + index} xs={2} md={1}>
              <ScalePanel
                scale={scale}
                data={scaleData[index]}
                weights={weights} />
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
          : <ScalePanelGrid scaleConfig={data.scales} weights={data.weights} />)}
    </>
  );
}
