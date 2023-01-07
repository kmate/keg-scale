import { Button, Divider } from '@mui/material';
import { Stack } from '@mui/system';
import * as React from 'react';

export default function KnownWeights(props) {

  const makeClickHandler = (mass) => {
    return () => {
      props.onClick(mass);
    }
  }

  return (
    <Stack divider={<Divider orientation="vertical" flexItem />} direction="row" alignItems="center" justifyContent="center">
      {props.children}
      {props.weights
        .filter((weight) => weight.forTare && props.forTare || weight.forCalibration && props.forCalibration)
        .map((weight, index) => {
        return (
          <Button key={"weight_" + index} onClick={makeClickHandler(weight.mass)}>{weight.label}</Button>
        );
      })}
    </Stack>
  );
}
