import React, { Component} from "react";
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
        <div className="App">
          <h1>Hello, Keg Scale!</h1>
        </div>
      </ThemeProvider>
    );
  }
}

export default App;
