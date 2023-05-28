import * as React from 'react';
import { Box, SvgIcon } from "@mui/material";

export default function BeerIcon({ color }) {
  return (
    <Box sx={{ backgroundColor: "white", borderRadius: 1, width: "50px" }}>
      <SvgIcon htmlColor={color} sx={{ display: "block", width: "100%", height: "100%" }} viewBox="0 0 512 512">
        <path d="M64 48l42.9 379.2c2.6 20.8 20.5 36.8 42.5 36.8h213.3c22 0 39.9-16 42.5-36.8L448 48H64zm327 124.8H121l-9.4-83.2h288.6l-9.2 83.2z" />
      </SvgIcon>
    </Box>
  );
}
