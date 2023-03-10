import { Button, Divider, ToggleButton, ToggleButtonGroup } from '@mui/material';
import { Stack } from '@mui/system';
import * as React from 'react';

export default function KnownWeights({ children, isToggle, onClick, weights, forTare, forCalibration }) {

  const [selectedLabel, setSelectedLabel] = React.useState(null);

  const makeClickHandler = (mass, label) => {
    return () => {
      onClick(mass);
      setSelectedLabel(label);
    }
  }

  const Btn = isToggle ? ToggleButton : Button;

  const buttons = (children || []).concat(
    weights
      .filter((weight) => forTare && weight.forTare || forCalibration && weight.forCalibration)
      .map((weight, index) => {
      return (
        <Btn key={"weight_" + index} value={weight.label} onClick={makeClickHandler(weight.mass, weight.label)}>{weight.label}</Btn>
      );
    })
  );

  return (
    <Stack divider={<Divider orientation="vertical" flexItem />} direction="row" alignItems="center" justifyContent="center">
      {isToggle ? <ToggleButtonGroup value={selectedLabel}>{buttons}</ToggleButtonGroup> : buttons}
    </Stack>
  );
}
