const percentFormatter = new Intl.NumberFormat("en-US", {
  style: "percent",
  maximumFractionDigits: 1
});
const numberFormatter = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 2
});
const timestampFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit"
});

export function formatPercent(value?: number | null) {
  if (value === null || value === undefined) return "n/a";
  return percentFormatter.format(value);
}

export function formatNumber(value?: number | null) {
  if (value === null || value === undefined) return "n/a";
  return numberFormatter.format(value);
}

export function formatTimestamp(value?: string | null) {
  if (!value) return "n/a";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return timestampFormatter.format(date);
}
