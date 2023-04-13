import React, { Component} from "react";
import MainTabs from "./MainTabs.jsx";
import "./App.css";

import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'

const darkTheme = createTheme({
  palette: {
    mode: 'dark',
  },
});

class App extends Component{
  render(){
    return(
      <ThemeProvider theme={darkTheme}>
        <CssBaseline />
        <LocalizationProvider dateAdapter={AdapterDayjs}>
          <MainTabs />
        </LocalizationProvider>
      </ThemeProvider>
    );
  }
}

export default App;
