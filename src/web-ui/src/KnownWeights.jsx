import * as React from 'react';

import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import Stack from '@mui/material/Stack';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';

export default function KnownWeights({ children, isToggle, selectFirst, onClick, weights, forTare, forCalibration }) {

  const shownWeights = weights.filter((weight) => forTare && weight.forTare || forCalibration && weight.forCalibration);

  const [selectedLabel, setSelectedLabel] = React.useState(selectFirst ? shownWeights[0].label : null);

  React.useEffect(() => {
    if (selectFirst) {
      onClick(shownWeights[0].mass);
      setSelectedLabel(shownWeights[0].label);
    }
  }, [selectFirst]);

  const makeClickHandler = (mass, label) => {
    return () => {
      onClick(mass);
      setSelectedLabel(label);
    }
  }

  const Btn = isToggle ? ToggleButton : Button;

  const buttons = (children || []).concat(
    shownWeights.map((weight, index) => {
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
