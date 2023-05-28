import * as React from 'react';

import { Divider, FormControl, MenuItem, Select } from '@mui/material';
import { volumeUnits } from './units';
import TapEntryProperties from './TapEntryProperties';
import TapChart from './TapChart';
import useLocalStorage from './useLocalStorage';

export default function TapMeasurement({ scaleIndex, data, isPaused, tapEntry }) {
  const [volumeUnit, setVolumeUnit] = useLocalStorage("tapVolumeUnit_" + scaleIndex, "L");

  const handleVolumeUnitChange = (e) => {
    setVolumeUnit(e.target.value);
  };

  return (
    <>
      <TapEntryProperties entry={tapEntry} sx={{ mx: 1 }}>
        <div style={{flex: '1 0 0'}} />
        <FormControl sx={{ minWidth: "150px" }}>
          <Select size="small" value={volumeUnit} onChange={handleVolumeUnitChange} sx={{ my: 1, ml: 1 }}>
            {Object.keys(volumeUnits).map(unit => {
              return <MenuItem key={ "volume_unit_" + unit } value={unit}>{unit}</MenuItem>;
            })}
          </Select>
        </FormControl>
      </TapEntryProperties>
      <Divider />
      <TapChart
        data={data}
        isPaused={isPaused}
        tapEntry={tapEntry}
        volumeUnit={volumeUnit}
        backroundColor="#252525" />
    </>
  );
}
