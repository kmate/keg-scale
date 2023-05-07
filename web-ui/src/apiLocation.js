import { useMock } from "./mock";

export default function apiLocation(slashedPath) {
  const origin =
    // use the default host name for local UI testing
    // and use the built-in mocks if asked for through location hash
    window.location.hostname == "localhost"
      ? useMock()
        ? "http://localhost:3000/mock"
        : "http://keg-scale.local"
      : window.location.origin;

  return origin + slashedPath;
}
