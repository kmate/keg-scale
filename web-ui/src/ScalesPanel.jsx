import * as React from 'react';
import useFetch from "react-fetch-hook";

import ErrorIndicator from './ErrorIndicator';
import LoadingIndicator from './LoadingIndicator';

export default function ScalesPanel() {

  const { isLoading, data, error } = useFetch("http://keg-scale.local/scales");

  return(
    <>
      { isLoading ? <LoadingIndicator /> : (error ? <ErrorIndicator error={error} /> : <p>TODO: render UI for {data.numScales} scales</p>)}
    </>
  );
}