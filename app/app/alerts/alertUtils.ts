import type { AlertItem } from "../../lib/types";

export type AlertState = "saved" | "dismissed" | "pending";

export const rangePresets = [
  { id: "60m", label: "Last 60m", minutes: 60 },
  { id: "24h", label: "Last 24h", minutes: 24 * 60 },
  { id: "7d", label: "Last 7d", minutes: 7 * 24 * 60 },
  { id: "custom", label: "Custom", minutes: null }
];

export const sortOptions = [
  { value: "newest", label: "Newest" },
  { value: "move", label: "Biggest move" },
  { value: "liquidity", label: "Highest liquidity" },
  { value: "volume", label: "Highest volume" },
  { value: "closest", label: "Closest to p=0.5" }
];

const alertStateKey = "alerts-state-v1";

export function parseList(value: string | null) {
  if (!value) return [] as string[];
  return value
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);
}

export function parseNumber(value: string | null, fallback: number) {
  if (!value) return fallback;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export function presetFromWindow(minutes: number) {
  const match = rangePresets.find((preset) => preset.minutes === minutes);
  return match ? match.id : "custom";
}

export function getMoveValue(alert: AlertItem) {
  const before = alert.old_price ?? alert.prev_market_p_yes;
  const after = alert.new_price ?? alert.market_p_yes;
  if (before !== null && before !== undefined && after !== null && after !== undefined) {
    return Math.abs(after - before);
  }
  const base = alert.delta_pct ?? alert.move ?? 0;
  return Math.abs(base);
}

export function getMoveDelta(alert: AlertItem) {
  const before = alert.old_price ?? alert.prev_market_p_yes ?? 0;
  const after = alert.new_price ?? alert.market_p_yes ?? 0;
  return after - before;
}

export function isFastAlert(alert: AlertItem) {
  return (alert.type || "").toUpperCase().includes("FAST");
}

export function isActionableAlert(alert: AlertItem) {
  const action = (alert.suggested_action || "").toUpperCase();
  return Boolean(action && action !== "IGNORE");
}

export function getAlertStateKey(alert: AlertItem) {
  if (alert.id !== null && alert.id !== undefined) {
    return `alert:${alert.id}`;
  }
  return `alert:${alert.market_id || "unknown"}:${alert.created_at || "unknown"}`;
}

export function loadAlertState() {
  if (typeof window === "undefined") {
    return {};
  }
  try {
    const raw = window.localStorage.getItem(alertStateKey);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, AlertState>;
    return parsed || {};
  } catch (error) {
    return {};
  }
}

export function saveAlertState(stateMap: Record<string, AlertState>) {
  if (typeof window === "undefined") {
    return;
  }
  try {
    window.localStorage.setItem(alertStateKey, JSON.stringify(stateMap));
  } catch (error) {
    // ignore storage errors
  }
}
