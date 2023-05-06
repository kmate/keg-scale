import * as React from 'react';

export default function TabPanel({ value, index, children, ...props }) {
  return (
    <div hidden={value !== index} {...props}>
      {value === index && (
        {...children}
      )}
    </div>
  );
}
