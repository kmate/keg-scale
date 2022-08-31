import * as React from 'react';
import useFetch from "react-fetch-hook";
import apiLocation from './apiLocation';

import ErrorIndicator from './ErrorIndicator';
import LoadingIndicator from './LoadingIndicator';

export default function ScalesPanel() {

  const { isLoading, data, error } = useFetch(apiLocation("/scales"));

  return(
    <>
      { isLoading ? <LoadingIndicator /> : (error ? <ErrorIndicator error={error} /> : <p>TODO: render UI for {data.numScales} scales</p>)}
    </>
  );
}
