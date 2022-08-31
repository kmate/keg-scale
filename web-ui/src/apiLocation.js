export default function apiLocation(slashedPath) {
  const origin =
    // use the default host name for local UI testing
    window.location.hostname == "localhost"
      ? "http://keg-scale.local"
      : window.location.origin;

  return origin + slashedPath;
}
