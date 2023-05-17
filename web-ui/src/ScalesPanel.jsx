import * as React from 'react';
import useFetch from "react-fetch-hook";
import merge from 'lodash.merge';

import Box from '@mui/material/Box';

import apiLocation from './apiLocation';
import ErrorIndicator from './ErrorIndicator';
import LoadingIndicator from './LoadingIndicator';
import ScalePanel from './ScalePanel';
import Scales from './scales';
import useLocalStorage from './useLocalStorage';
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

  const [fullScreenIndex, setFullScreenIndex] = useLocalStorage("fullScreenIndex", -1);

  const makeEnterFullScreenHandler = (index) => () => {
    setFullScreenIndex(index);
  }

  const exitFullScreenHandler = () => {
    setFullScreenIndex(-1);
  }

  const scalePanels = scales.instances.map((scale, index) => {
    return (
      <ScalePanel
        key={"scale_" + index}
        scale={scale}
        data={scaleData[index]}
        weights={weights}
        fullScreen={{
          isActive: fullScreenIndex == index,
          onEnter: makeEnterFullScreenHandler(index),
          onExit: exitFullScreenHandler
        }}/>
    );
  });

  return (
    <>
      {fullScreenIndex >= 0 &&
        <Box padding={1} height={1}>{scalePanels[fullScreenIndex]}</Box>}
      {fullScreenIndex < 0 &&
        <Box padding={1} className="scalesGrid">
          {scalePanels}
        </Box>}
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
