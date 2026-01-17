import type { AlertItem } from "./types";
import { formatPercent } from "./formatters";

type ProbabilityDisplay = {
  label: string;
  current: number | null | undefined;
  previous: number | null | undefined;
  currentText: string;
  previousText: string | null;
  compact: string;
  range: string;
};

function sanitizeOutcomeLabel(label: string | null | undefined) {
  if (!label) return null;
  const cleaned = String(label).trim().replace(/[^A-Za-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
  if (!cleaned) return null;
  const upper = cleaned.toUpperCase();
  if (upper === "OUTCOME_0" || upper === "OUTCOME0") return null;
  return upper;
}

function resolveProbabilityLabel(alert: AlertItem) {
  const marketKind = alert.market_kind ?? null;
  const isYesNo = alert.is_yesno ?? null;
  const isYesNoMarket = marketKind === "yesno" || isYesNo === true;
  const mappingConfidence = alert.mapping_confidence ?? null;
  const sanitized = sanitizeOutcomeLabel(alert.primary_outcome_label ?? null);
  const isYesNoLabel = sanitized === "YES" || sanitized === "NO";
  const isOuLabel = sanitized === "OVER" || sanitized === "UNDER";
  const primaryEligible =
    mappingConfidence === "verified" &&
    sanitized &&
    !isYesNoLabel &&
    !(isOuLabel && marketKind !== "ou");

  const explicit = alert.probability_label;
  if (explicit && typeof explicit === "string") {
    if (explicit === "p_yes" && !isYesNoMarket && primaryEligible) {
      return `p_${sanitized}`;
    }
    return explicit;
  }

  if (isYesNoMarket) return "p_yes";
  if (!primaryEligible) return "p_outcome0";
  return `p_${sanitized}`;
}

export function formatProbability(alert: AlertItem): ProbabilityDisplay {
  const label = resolveProbabilityLabel(alert);
  const current = alert.probability_curr ?? alert.market_p_yes ?? null;
  const previous = alert.probability_prev ?? alert.prev_market_p_yes ?? null;
  const currentText = formatPercent(current);
  const previousText = previous === null || previous === undefined ? null : formatPercent(previous);
  const compact = `${label} ${currentText}`;
  const range = previousText ? `${label} ${previousText} -> ${currentText}` : compact;
  return {
    label,
    current,
    previous,
    currentText,
    previousText,
    compact,
    range
  };
}
