import * as React from 'react';
import useFetch from "react-fetch-hook";
import apiLocation from './apiLocation';

import { Box, Grid } from '@mui/material';

import ErrorIndicator from './ErrorIndicator';
import LoadingIndicator from './LoadingIndicator';
import ScalePanel from './ScalePanel';

function ScalePanelGrid(props) {
  return (
    <Box sx={{ flexGrow: 1, p: 1 }}>
      <Grid container columns={2} spacing={1}>
        {[...Array(props.numScales).keys()].map((index) => {
          return (
            <Grid item key={"scale_" + index} xs={2} md={1}>
              <ScalePanel index={index} />
            </Grid>
          );
        })}
      </Grid>
    </Box>
  );
}

export default function ScalesPanel() {

  const { isLoading, data, error } = useFetch(apiLocation("/scales"));

  return(
    <>
      { isLoading ? <LoadingIndicator /> : (error ? <ErrorIndicator error={error} /> : <ScalePanelGrid numScales={data.numScales} />)}
    </>
  );
}
