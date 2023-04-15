import * as React from 'react';
import { densityUnits } from './units';
import InputWithUnit from './InputWithUnit';

export default function DensityInput({ value, onChange }) {
  return (
    <InputWithUnit
      label="Density"
      units={densityUnits}
      defaultUnit="g/L"
      defaultValue="1000"
      value={value}
      onChange={onChange}
      isValid={(parsed) => parsed >= 980 && parsed <= 1300} />
  );
}
