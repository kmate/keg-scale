export const massUnits = {
  g: {
    multiplier: 1, // g is the default mass unit
    digits: 0,
    isVolumeUnit: false,
  },
  kg: {
    multiplier: 1 / 1000,
    digits: 2,
    isVolumeUnit: false,
  },
  lb: {
    multiplier: 1 / 453.59237,
    digits: 2,
    isVolumeUnit: false,
  },
};

export const volumeUnits = {
  dl: {
    multiplier: 10,
    digits: 1,
    isVolumeUnit: true,
  },
  l: {
    multiplier: 1, // L is the default volume unit
    digits: 2,
    isVolumeUnit: true,
  },
  "US fl oz": {
    multiplier: 1 / 0.0295735296,
    digits: 1,
    isVolumeUnit: true,
  },
  "UK fl oz": {
    multiplier: 1 / 0.02841306,
    digits: 1,
    isVolumeUnit: true,
  },
  "US gallon": {
    multiplier: 1 / 3.785411784,
    digits: 1,
    isVolumeUnit: true,
  },
  "UK gallon": {
    multiplier: 1 / 4.54609,
    digits: 1,
    isVolumeUnit: true,
  },
};

export const measuredUnits = {
  ...massUnits,
  ...volumeUnits,
};

export const densityUnits = {
  "g/L": {
    from: (d) => d,
    to: (d) => d,
    digits: 0,
  },
  "SG points": {
    from: (d) => d - 1000,
    to: (d) => d + 1000,
    digits: 0,
  },
  "°P": {
    from: (d) => 259 - 259 / (d / 1000),
    to: (d) => (259 / (259 - d)) * 1000,
    digits: 1,
  },
};

export const colorUnits = {
  SRM: {
    from: (srm) => srm,
    to: (srm) => srm,
    digits: 1,
  },
  EBC: {
    from: (srm) => srm * 1.97,
    to: (ebc) => ebc * 0.508,
    digits: 1,
  },
  "°L": {
    from: (srm) => (srm + 0.76) / 1.3546,
    to: (l) => 1.3546 * l - 0.76,
    digits: 1,
  },
};
