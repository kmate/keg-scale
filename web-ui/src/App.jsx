import React from "react";
import MainTabs from "./MainTabs.jsx";
import "./App.css";

import createTheme from '@mui/material/styles/createTheme';
import ThemeProvider from '@mui/material/styles/ThemeProvider';
import CssBaseline from '@mui/material/CssBaseline';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import { ConfirmProvider } from 'material-ui-confirm';
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
        <ConfirmProvider defaultOptions={{
          title: "Confirmation",
          confirmationText: "Yes",
          cancellationText: "No"
        }}>
          <MainTabs />
        </ConfirmProvider>
      </LocalizationProvider>
    </ThemeProvider>
  );
}
