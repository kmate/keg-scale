import React, { Component} from "react";
import MainTabs from "./MainTabs.jsx";
import "./App.css";

import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';

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
        <MainTabs />
      </ThemeProvider>
    );
  }
}

export default App;
