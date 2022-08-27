const units = ["bytes", "KiB", "MiB"];

export default function formatBytes(bytes) {
  let l = 0;
  let n = parseInt(bytes, 10) || 0;

  while (n >= 1024 && ++l) {
    n = n / 1024;
  }

  return n.toFixed(n < 10 && l > 0 ? 1 : 0) + " " + units[l];
}
