import * as React from 'react';
import useFetch from "react-fetch-hook";
import merge from 'lodash.merge';

import Grid from '@mui/material/Grid';

import apiLocation from './apiLocation';
import ErrorIndicator from './ErrorIndicator';
import LoadingIndicator from './LoadingIndicator';
import ScalePanel from './ScalePanel';
import Scales from './scales';
import { creteMockScaleData, useMock } from './mock';

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
    if (useMock()) {
      setScaleData(creteMockScaleData(scaleConfig));
    } else {
      scales.open();
      return () => {
        scales.close();
      };
    }
  }, [scaleConfig]);

  const [fullScreenIndex, setFullscreenIndex] = React.useState(-1);

  const makeEnterFullScreenHandler = (index) => () => {
    setFullscreenIndex(index);
  }

  const exitFullScreenHandler = () => {
    setFullscreenIndex(-1);
  }

  const scalePanels = scales.instances.map((scale, index) => {
    return (
      <Grid item key={"scale_" + index} xs={2} md={1}>
        <ScalePanel
          scale={scale}
          data={scaleData[index]}
          weights={weights}
          fullScreen={{
            isActive: fullScreenIndex == index,
            onEnter: makeEnterFullScreenHandler(index),
            onExit: exitFullScreenHandler
          }}/>
      </Grid>
    );
  });

  return (
    <>
      {fullScreenIndex >= 0 && scalePanels[fullScreenIndex]}
      {fullScreenIndex < 0 &&
        <Grid container columns={2} spacing={1} padding={1}>
          {scalePanels}
        </Grid>}
    </>
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
