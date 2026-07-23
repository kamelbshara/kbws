// Validated categorical + status palette (light mode only — this app has no dark mode yet).
// See dataviz skill references/palette.md; first 3 categorical slots validated all-pairs.
export const CATEGORICAL = {
  blue: "#2a78d6",
  orange: "#eb6834",
  aqua: "#1baf7a",
} as const;

export const STATUS = {
  good: "#0ca30c",
  warning: "#fab219",
  serious: "#ec835a",
  critical: "#d03b3b",
  neutral: "#898781",
} as const;
