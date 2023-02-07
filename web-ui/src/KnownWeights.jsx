import { Button, Divider, ToggleButton, ToggleButtonGroup } from '@mui/material';
import { Stack } from '@mui/system';
import * as React from 'react';

export default function KnownWeights(props) {

  const [selectedLabel, setSelectedLabel] = React.useState(null);

  const makeClickHandler = (mass, label) => {
    return () => {
      props.onClick(mass);
      setSelectedLabel(label);
    }
  }

  const Btn = props.isToggle ? ToggleButton : Button;

  const children = (props.children || []).concat(
    props.weights
      .filter((weight) => weight.forTare && props.forTare || weight.forCalibration && props.forCalibration)
      .map((weight, index) => {
      return (
        <Btn key={"weight_" + index} value={weight.label} onClick={makeClickHandler(weight.mass, weight.label)}>{weight.label}</Btn>
      );
    })
  );

  return (
    <Stack divider={<Divider orientation="vertical" flexItem />} direction="row" alignItems="center" justifyContent="center">
      {props.isToggle ? <ToggleButtonGroup value={selectedLabel}>{children}</ToggleButtonGroup> : children}
    </Stack>
  );
}
