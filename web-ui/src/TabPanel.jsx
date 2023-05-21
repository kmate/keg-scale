import * as React from 'react';

export default function TabPanel({ value, index, children, ...props }) {
  return (
    value === index
      ? <div {...props}>
          {value === index && (
            {...children}
          )}
        </div>
      : <></>
  );
}
