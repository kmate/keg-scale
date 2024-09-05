import createTapMockData from "./createTapMockData";

export function useMock() {
  return window.location.hash == "#use-mock";
}

export function creteMockScaleData() {
  const tapEntry = {
    id: "Q7HUdbr4vt9l1D4C5Ai1SPDYJQ0dYf",
    number: 27,
    name: "Tripel Test 2 (mock)",
    bottlingDate: "2022-12-02",
    bottlingVolume: 18.29999924,
    finalGravity: 1002,
    abv: 10.89999962,
    srm: 6.699999809,
  };

  return [
    {
      index: 0,
      state: {
        name: "recording",
        isPaused: false,
        tapEntry: tapEntry,
        data: createTapMockData(tapEntry.bottlingVolume, tapEntry.bottlingDate),
      },
    },
    {
      index: 1,
      state: {
        name: "standby",
      },
    },
    {
      index: 2,
      state: {
        name: "offline",
      },
    },
    {
      index: 3,
      state: {
        name: "liveMeasurement",
        data: 4210,
      },
    },
  ];
}
