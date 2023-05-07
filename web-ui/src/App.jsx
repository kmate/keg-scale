import React from "react";
import MainTabs from "./MainTabs.jsx";
import "./App.css";

import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import { useMock } from "./mock.js";

const darkTheme = createTheme({
  palette: {
    mode: 'dark',
  },
});

export default function App() {

  if (useMock()) {
    console.warn('Using mock data instead of real values.');
  }

  return (
    <ThemeProvider theme={darkTheme}>
      <CssBaseline />
      <LocalizationProvider dateAdapter={AdapterDayjs}>
        <MainTabs />
      </LocalizationProvider>
    </ThemeProvider>
  );
}
