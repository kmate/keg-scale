import * as React from 'react';

export default function TabPanel({ value, index, children, ...props }) {
  return (
    <div style={ value !== index ? { display: "none" } : {} } {...props}>
      {value === index && (
        {...children}
      )}
    </div>
  );
}
