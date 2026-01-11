"use client";

import MagicBadge from "./magicui/MagicBadge";
import MagicButton from "./magicui/MagicButton";
import type { AlertItem } from "../lib/types";

type Props = {
  alert: AlertItem | null;
  windowMinutes: number;
  onClose: () => void;
};

const percentFormatter = new Intl.NumberFormat("en-US", {
  style: "percent",
  maximumFractionDigits: 1
});
const numberFormatter = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 2
});

function formatPercent(value?: number | null) {
  if (value === null || value === undefined) return "n/a";
  return percentFormatter.format(value);
}

function formatNumber(value?: number | null) {
  if (value === null || value === undefined) return "n/a";
  return numberFormatter.format(value);
}

function formatTimestamp(value?: string | null) {
  if (!value) return "n/a";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  }).format(date);
}

export default function AlertDrawer({ alert, windowMinutes, onClose }: Props) {
  if (!alert) return null;

  const priceBefore = alert.old_price ?? alert.prev_market_p_yes;
  const priceAfter = alert.new_price ?? alert.market_p_yes;
  const action = alert.suggested_action || "n/a";

  const summary = [
    `${alert.title}`,
    `Theme: ${alert.category || "n/a"}`,
    `Signal: ${alert.signal_type || "n/a"} (${alert.confidence || "n/a"})`,
    `Move: ${formatPercent(alert.delta_pct ?? alert.move)} | p_yes ${formatPercent(alert.market_p_yes)}`,
    `Liquidity ${formatNumber(alert.liquidity)} | Vol 24h ${formatNumber(alert.volume_24h)}`,
    `Action: ${action}`,
    `Window: ${windowMinutes}m`
  ].join("\n");

  const copyToClipboard = (text: string) => {
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(text);
      return;
    }
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();
    document.execCommand("copy");
    document.body.removeChild(textarea);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-ink/40 p-4 sm:items-center"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl rounded-2xl bg-white shadow-card"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate/10 p-5">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-slate">Alert Detail</p>
            <h2 className="mt-1 text-lg font-semibold text-ink">{alert.title}</h2>
            <p className="mt-1 text-xs text-slate">{formatTimestamp(alert.created_at)}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <MagicButton
              variant="secondary"
              size="sm"
              onClick={() => copyToClipboard(alert.market_url)}
            >
              Copy link
            </MagicButton>
            <MagicButton variant="secondary" size="sm" href={alert.market_url}>
              Open market
            </MagicButton>
            <MagicButton variant="ghost" size="sm" onClick={onClose}>
              Close
            </MagicButton>
          </div>
        </div>
        <div className="grid gap-4 p-5 text-sm">
          <div className="grid gap-3 md:grid-cols-2">
            <div className="rounded-xl bg-fog p-3">
              <p className="text-xs uppercase text-slate">Probability</p>
              <p className="mt-1 text-base font-semibold text-ink">
                {formatPercent(alert.market_p_yes)}
              </p>
              <p className="mt-1 text-xs text-slate">
                {formatPercent(priceBefore)} to {formatPercent(priceAfter)}
              </p>
            </div>
            <div className="rounded-xl bg-fog p-3">
              <p className="text-xs uppercase text-slate">Move / Strength</p>
              <p className="mt-1 text-base font-semibold text-ink">
                {formatPercent(alert.delta_pct ?? alert.move)}
              </p>
              <p className="mt-1 text-xs text-slate">
                {alert.strength || alert.confidence || "n/a"} strength
              </p>
            </div>
            <div className="rounded-xl bg-fog p-3">
              <p className="text-xs uppercase text-slate">Liquidity / Vol 24h</p>
              <p className="mt-1 text-base font-semibold text-ink">
                {formatNumber(alert.liquidity)} / {formatNumber(alert.volume_24h)}
              </p>
            </div>
            <div className="rounded-xl bg-fog p-3">
              <p className="text-xs uppercase text-slate">Signal / Action</p>
              <p className="mt-1 text-base font-semibold text-ink">
                {alert.signal_type || alert.type}
              </p>
              <p className="mt-1 text-xs text-slate">Suggested: {action}</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <MagicBadge>{alert.type}</MagicBadge>
            {alert.delivery_status && <MagicBadge>{alert.delivery_status}</MagicBadge>}
            {alert.category && <MagicBadge>{alert.category}</MagicBadge>}
            {alert.signal_type && <MagicBadge>{alert.signal_type}</MagicBadge>}
          </div>
          <div>
            <p className="text-xs uppercase text-slate">Filter Reasons</p>
            {alert.filter_reasons?.length ? (
              <div className="mt-2 flex flex-wrap gap-2">
                {alert.filter_reasons.map((reason) => (
                  <span
                    key={reason}
                    className="rounded-full border border-slate/30 px-3 py-1 text-xs text-slate"
                  >
                    {reason}
                  </span>
                ))}
              </div>
            ) : (
              <p className="mt-2 text-sm text-slate">None</p>
            )}
          </div>
          {alert.message && (
            <div>
              <p className="text-xs uppercase text-slate">Message</p>
              <p className="mt-2 text-sm text-ink">{alert.message}</p>
            </div>
          )}
          <div className="flex flex-wrap items-center gap-2">
            <MagicButton variant="primary" size="sm" onClick={() => copyToClipboard(summary)}>
              Copy summary
            </MagicButton>
          </div>
        </div>
      </div>
    </div>
  );
}

