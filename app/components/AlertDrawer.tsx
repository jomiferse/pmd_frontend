"use client";

import { useEffect, useMemo, useState } from "react";
import {
  LineChart,
  Line,
  ReferenceArea,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import Badge from "./ui/Badge";
import Button from "./ui/Button";
import Skeleton from "./ui/Skeleton";
import { apiClient } from "../lib/apiClient";
import { formatNumber, formatPercent, formatTimestamp } from "../lib/formatters";
import { formatProbability } from "../lib/alertFormatters";
import type { AlertItem } from "../lib/types";

type Props = {
  alert: AlertItem | null;
  windowMinutes: number;
  onClose: () => void;
};

type HistoryRange = "1h" | "6h" | "24h" | "7d";

type HistoryPoint = {
  ts: string;
  p_yes: number;
  p_no?: number | null;
  p_no_derived?: boolean | null;
  liquidity?: number;
  volume_24h?: number;
};

type HistoryPayload = {
  points: HistoryPoint[];
  meta?: {
    market_id?: string;
    range?: string;
    start_ts?: string;
    end_ts?: string;
    alert_ts?: string;
    min_ts?: string | null;
    max_ts?: string | null;
    is_yesno?: boolean | null;
    market_kind?: string | null;
  };
};

const historyRanges: { id: HistoryRange; label: string; minutes: number }[] = [
  { id: "1h", label: "1h", minutes: 60 },
  { id: "6h", label: "6h", minutes: 6 * 60 },
  { id: "24h", label: "24h", minutes: 24 * 60 },
  { id: "7d", label: "7d", minutes: 7 * 24 * 60 }
];

const historyCache = new Map<string, HistoryPayload>();

function getRangeAvailability(historyData: HistoryPayload | null, alertTimestampMs: number | null) {
  if (!historyData?.meta || !alertTimestampMs) return null;
  const minTsRaw = historyData.meta.min_ts;
  if (!minTsRaw) return new Set<HistoryRange>();
  const minTs = new Date(minTsRaw).getTime();
  if (Number.isNaN(minTs)) return new Set<HistoryRange>();
  const available = new Set<HistoryRange>();
  historyRanges.forEach((range) => {
    const startTs = alertTimestampMs - range.minutes * 60 * 1000;
    if (minTs <= startTs) {
      available.add(range.id);
    }
  });
  if (available.size === 0) {
    available.add("1h");
  }
  return available;
}

function formatOutcomeLabel(label: string | null | undefined) {
  if (!label) return null;
  const trimmed = label.trim();
  if (!trimmed) return null;
  const normalized = trimmed.replace(/_/g, " ");
  const isAllCaps = normalized === normalized.toUpperCase();
  if (!isAllCaps) return normalized;
  return normalized
    .toLowerCase()
    .split(" ")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export default function AlertDrawer({ alert, windowMinutes, onClose }: Props) {
  const [historyRange, setHistoryRange] = useState<HistoryRange>("24h");
  const [historyState, setHistoryState] = useState<{
    key: string | null;
    data: HistoryPayload | null;
    error: string | null;
  }>({
    key: null,
    data: null,
    error: null
  });
  const [showNoLine, setShowNoLine] = useState(false);

  const alertTimestampMs = useMemo(() => {
    if (!alert) return null;
    const raw = alert.snapshot_bucket || alert.triggered_at || alert.created_at;
    const parsed = raw ? new Date(raw).getTime() : null;
    if (parsed === null || Number.isNaN(parsed)) return null;
    return parsed;
  }, [alert]);

  const alertId = alert?.id ?? null;
  const cacheKey = alertId !== null ? `${alertId}:${historyRange}` : null;
  const cachedHistory = cacheKey ? historyCache.get(cacheKey) ?? null : null;
  const isHistoryCurrent = historyState.key === cacheKey;
  const historyData = cachedHistory ?? (isHistoryCurrent ? historyState.data : null);
  const historyError = cachedHistory ? null : (isHistoryCurrent ? historyState.error : null);
  const historyLoading = !cachedHistory && cacheKey !== null && !isHistoryCurrent;

  const rangeAvailability = useMemo(
    () => getRangeAvailability(historyData, alertTimestampMs),
    [historyData, alertTimestampMs]
  );

  useEffect(() => {
    if (alertId === null || !cacheKey) return;
    if (cachedHistory) return;

    let active = true;
    const requestedKey = cacheKey;
    const requestedRange = historyRange;

    apiClient
      .get<HistoryPayload>(`/alerts/${alertId}/history`, {
        params: { range: requestedRange }
      })
      .then((result) => {
        if (!active) return;
        if (!result.ok || !result.data) {
          setHistoryState({
            key: requestedKey,
            data: null,
            error: result.error || "Failed to load history"
          });
          return;
        }
        historyCache.set(requestedKey, result.data);
        setHistoryState({
          key: requestedKey,
          data: result.data,
          error: null
        });
        const available = getRangeAvailability(result.data, alertTimestampMs);
        if (available && available.size > 0 && !available.has(requestedRange)) {
          const fallback = historyRanges.find((range) => available.has(range.id));
          if (fallback) {
            setHistoryRange(fallback.id);
          }
        }
      })
      .catch(() => {
        if (!active) return;
        setHistoryState({
          key: requestedKey,
          data: null,
          error: "Failed to load history"
        });
      });

    return () => {
      active = false;
    };
  }, [alertId, alertTimestampMs, cacheKey, cachedHistory, historyRange]);

  const chartData = (historyData?.points || [])
    .map((point) => {
      const ts = new Date(point.ts).getTime();
      if (Number.isNaN(ts)) return null;
      return { ts, p_yes: point.p_yes, p_no: point.p_no ?? null };
    })
    .filter(Boolean) as { ts: number; p_yes: number; p_no: number | null }[];

  if (!alert) return null;

  const probability = formatProbability(alert);
  const isYesNoLabel = probability.label === "p_yes";
  const friendlyOutcome = formatOutcomeLabel(alert.primary_outcome_label) || (isYesNoLabel ? "Yes" : "Outcome");
  const probabilityHeading = `${friendlyOutcome} implied probability`;
  const probabilityLegendLabel = isYesNoLabel ? "YES" : friendlyOutcome;
  const priceBefore = alert.old_price ?? alert.prev_market_p_yes;
  const action = alert.suggested_action || "n/a";
  const strengthLabel = alert.strength || alert.confidence || "n/a";
  const alertTimestamp = alert.snapshot_bucket || alert.triggered_at || alert.created_at;

  const summaryProbability = isYesNoLabel
    ? `p_yes ${formatPercent(alert.market_p_yes)}`
    : probability.range;

  const summary = [
    `${alert.title}`,
    `Theme: ${alert.category || "n/a"}`,
    `Signal: ${alert.signal_type || "n/a"} (${strengthLabel})`,
    `Move: ${formatPercent(alert.delta_pct ?? alert.move)} | ${summaryProbability}`,
    `Liquidity ${formatNumber(alert.liquidity)} | Vol 24h ${formatNumber(alert.volume_24h)}`,
    `Action: ${action}`,
    `Window: ${windowMinutes}m`,
    alert.filter_reasons?.length ? `Filters: ${alert.filter_reasons.join(", ")}` : ""
  ]
    .filter(Boolean)
    .join("\n");

  const alertMarkerTs = alertTimestampMs ?? (alertTimestamp ? new Date(alertTimestamp).getTime() : null);
  const windowStartTs =
    alertMarkerTs !== null ? alertMarkerTs - windowMinutes * 60 * 1000 : null;

  const historyMeta = historyData?.meta;
  const historyRangeMinutes = historyRanges.find((range) => range.id === historyRange)?.minutes ?? null;
  const isYesNo = historyMeta?.is_yesno ?? null;
  const isYesNoMarket = isYesNoLabel && isYesNo !== false;
  const hasNoSeries = chartData.some((point) => point.p_no !== null && point.p_no !== undefined);
  const noLineUnavailable = isYesNoMarket && !hasNoSeries;
  const showNoLineToggle = isYesNoMarket;
  const showWindowBand = windowMinutes === 60 && windowStartTs !== null && alertMarkerTs !== null;
  const timeFormatter = new Intl.DateTimeFormat("en-US", {
    hour: "2-digit",
    minute: "2-digit"
  });
  const endTimeLabel =
    historyMeta?.end_ts && !Number.isNaN(new Date(historyMeta.end_ts).getTime())
      ? timeFormatter.format(new Date(historyMeta.end_ts))
      : null;
  const relativeRangeLabel =
    historyRangeMinutes !== null
      ? historyRangeMinutes >= 1440 && historyRangeMinutes % 1440 === 0
        ? `last ${historyRangeMinutes / 1440}d`
        : historyRangeMinutes >= 60 && historyRangeMinutes % 60 === 0
          ? `last ${historyRangeMinutes / 60}h`
          : `last ${historyRangeMinutes}m`
      : null;
  const rangeFooterText = relativeRangeLabel && endTimeLabel
    ? `Range: ${relativeRangeLabel} ending at ${endTimeLabel}`
    : "";

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
        className="flex w-full max-w-5xl max-h-[calc(100vh-2rem)] flex-col overflow-hidden rounded-2xl bg-white shadow-card"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate/10 p-5">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-slate">Alert Detail</p>
            <h2 className="mt-1 text-lg font-semibold text-ink">{alert.title}</h2>
            <p className="mt-1 text-xs text-slate">{formatTimestamp(alertTimestamp)}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="ghost" size="sm" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto px-5 pb-6 pt-4">
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
            <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="text-xs uppercase text-slate">Probability History</p>
                <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate">
                  <span>{probabilityHeading}</span>
                  <span className="rounded-full border border-slate/20 px-2 py-0.5 text-[10px] uppercase">
                    {probability.label}
                  </span>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center gap-1 rounded-full border border-slate/20 bg-white px-1 py-1">
                  {historyRanges.map((range) => {
                    const disabled = rangeAvailability ? !rangeAvailability.has(range.id) : false;
                    return (
                      <button
                        key={range.id}
                        type="button"
                        onClick={() => setHistoryRange(range.id)}
                        disabled={disabled}
                        className={`rounded-full px-3 py-1 text-[11px] font-semibold transition ${
                          historyRange === range.id
                            ? "bg-ink text-white"
                            : "text-slate hover:text-ink"
                        } ${disabled ? "cursor-not-allowed opacity-40" : ""}`}
                      >
                        {range.label}
                      </button>
                    );
                  })}
                </div>
                {showNoLineToggle && (
                  <button
                    type="button"
                    onClick={() => setShowNoLine((value) => !value)}
                    aria-pressed={showNoLine}
                    className={`rounded-full border px-3 py-1 text-[11px] font-semibold transition ${
                      showNoLine ? "border-ink bg-ink text-white" : "border-slate/30 text-slate hover:text-ink"
                    }`}
                  >
                    NO line
                  </button>
                )}
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate">
              <span className="flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-ink" />
                {probabilityLegendLabel}
              </span>
              {showNoLineToggle && (
                <>
                  <span className={`flex items-center gap-1 ${noLineUnavailable ? "opacity-40" : ""}`}>
                    <span className="h-2 w-2 rounded-full bg-slate-500" />
                    NO
                  </span>
                  {noLineUnavailable && (
                    <span>NO line available only for yes/no markets with stored p_no.</span>
                  )}
                </>
              )}
            </div>
            <div className="rounded-2xl border border-white/70 bg-white/90 p-3 shadow-soft">
              {historyLoading ? (
                <Skeleton className="h-48 w-full" />
              ) : historyError ? (
                <div className="flex h-48 items-center justify-center text-sm text-rose-500">
                  {historyError}
                </div>
              ) : chartData.length ? (
                <div className="h-56 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData} margin={{ top: 10, right: 12, left: 0, bottom: 0 }}>
                      <XAxis
                        dataKey="ts"
                        type="number"
                        domain={["dataMin", "dataMax"]}
                        tickFormatter={(value) => formatTimestamp(new Date(value).toISOString())}
                        tick={{ fontSize: 10, fill: "#94a3b8" }}
                      />
                      <YAxis
                        domain={[0, 1]}
                        tickFormatter={(value) => `${Math.round(value * 100)}%`}
                        tick={{ fontSize: 10, fill: "#94a3b8" }}
                      />
                      <Tooltip
                        formatter={(value) => formatPercent(Number(value))}
                        labelFormatter={(label) => formatTimestamp(new Date(label).toISOString())}
                        contentStyle={{ borderRadius: "12px", borderColor: "#e2e8f0" }}
                      />
                      {showWindowBand && (
                        <ReferenceArea
                          x1={windowStartTs}
                          x2={alertMarkerTs}
                          fill="#e2e8f0"
                          fillOpacity={0.2}
                        />
                      )}
                      {alertMarkerTs !== null && (
                        <ReferenceLine
                          x={alertMarkerTs}
                          stroke="#111827"
                          strokeDasharray="4 4"
                          label={{
                            value: "Alert triggered",
                            position: "top",
                            fill: "#64748b",
                            fontSize: 10,
                            offset: 6
                          }}
                        />
                      )}
                      <Line
                        type="monotone"
                        dataKey="p_yes"
                        name={probabilityLegendLabel}
                        stroke="#111827"
                        strokeWidth={2}
                        dot={false}
                        isAnimationActive={false}
                      />
                      <Line
                        type="monotone"
                        dataKey="p_no"
                        name="NO"
                        stroke="#64748b"
                        strokeWidth={2}
                        dot={false}
                        isAnimationActive={false}
                        hide={!showNoLineToggle || noLineUnavailable || !showNoLine}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="flex h-48 flex-col items-center justify-center text-sm text-slate">
                  <p>No history available.</p>
                  <p className="text-xs text-slate">This market has no stored snapshots for this range.</p>
                </div>
              )}
              {rangeFooterText && (
                <div className="mt-3 text-[11px] text-slate">{rangeFooterText}</div>
              )}
            </div>
            </div>
            <div className="space-y-3">
            <div className="rounded-2xl border border-white/70 bg-white/90 p-4 shadow-soft">
              <p className="text-xs uppercase text-slate">Key metrics</p>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl bg-fog p-3">
                  <div className="flex flex-wrap items-center gap-2 text-[11px] uppercase text-slate">
                    <span>Implied probability</span>
                    <span className="rounded-full border border-slate/20 px-2 py-0.5 text-[10px] uppercase">
                      {probability.label}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-slate">{probabilityHeading}</p>
                  <p className="mt-1 text-base font-semibold text-ink">
                    {isYesNoLabel ? formatPercent(alert.market_p_yes) : probability.compact}
                  </p>
                  <p className="mt-1 text-xs text-slate">
                    Prev {isYesNoLabel ? formatPercent(priceBefore) : probability.previousText ?? "n/a"}
                  </p>
                </div>
                <div className="rounded-xl bg-fog p-3">
                  <p className="text-[11px] uppercase text-slate">Move / Strength</p>
                  <p className="mt-1 text-base font-semibold text-ink">
                    {formatPercent(alert.delta_pct ?? alert.move)}
                  </p>
                  <p className="mt-1 text-xs text-slate">{strengthLabel}</p>
                </div>
                <div className="rounded-xl bg-fog p-3">
                  <p className="text-[11px] uppercase text-slate">Liquidity / Vol 24h</p>
                  <p className="mt-1 text-base font-semibold text-ink">
                    {formatNumber(alert.liquidity)} / {formatNumber(alert.volume_24h)}
                  </p>
                </div>
                <div className="rounded-xl bg-fog p-3">
                  <p className="text-[11px] uppercase text-slate">Signal / Action</p>
                  <p className="mt-1 text-base font-semibold text-ink">
                    {alert.signal_type || alert.type}
                  </p>
                  <p className="mt-1 text-xs text-slate">Suggested: {action}</p>
                </div>
              </div>
            </div>
            <div className="rounded-2xl border border-white/70 bg-white/90 p-4 shadow-soft">
              <p className="text-xs uppercase text-slate">Context</p>
              <div className="mt-3 grid gap-2 text-xs text-slate">
                <div>Market: {alert.market_slug || alert.market_id}</div>
                <div>Theme: {alert.category || "n/a"}</div>
                <div>Data points: {alert.sustained ?? 0}</div>
              </div>
              <details className="mt-3 rounded-xl bg-fog p-3 text-xs text-slate">
                <summary className="cursor-pointer text-[11px] uppercase tracking-[0.2em] text-slate">
                  Advanced
                </summary>
                <div className="mt-2 grid gap-1">
                  <div>Alert ID: {alert.id ?? "n/a"}</div>
                  <div>Market ID: {alert.market_id || "n/a"}</div>
                  <div>Snapshot bucket: {formatTimestamp(alert.snapshot_bucket)}</div>
                  <div>Triggered at: {formatTimestamp(alert.triggered_at)}</div>
                  <div>Source ts: {formatTimestamp(alert.source_ts)}</div>
                  <div>Reversal flag: {alert.reversal || "n/a"}</div>
                </div>
              </details>
            </div>
            <div className="rounded-2xl border border-white/70 bg-white/90 p-4 shadow-soft">
              <p className="text-xs uppercase text-slate">Tags</p>
              <div className="mt-2 flex flex-wrap gap-2">
                <Badge>{alert.type}</Badge>
                {alert.category && <Badge>{alert.category}</Badge>}
                {alert.signal_type && <Badge>{alert.signal_type}</Badge>}
                {strengthLabel && <Badge>{strengthLabel}</Badge>}
                {alert.delivery_status && <Badge>{alert.delivery_status}</Badge>}
              </div>
            </div>
            <div className="rounded-2xl border border-white/70 bg-white/90 p-4 shadow-soft">
              <p className="text-xs uppercase text-slate">Filter reasons</p>
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
                <p className="mt-2 text-xs text-slate">None</p>
              )}
            </div>
            {alert.message && (
              <div className="rounded-2xl border border-white/70 bg-white/90 p-4 shadow-soft">
                <p className="text-xs uppercase text-slate">Message</p>
                <p className="mt-2 text-sm text-ink">{alert.message}</p>
              </div>
            )}
            <div className="rounded-2xl border border-white/70 bg-white/90 p-4 shadow-soft">
              <p className="text-xs uppercase text-slate">Actions</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => window.open(alert.market_url, "_blank", "noopener,noreferrer")}
                >
                  Open market
                </Button>
                <Button variant="secondary" size="sm" onClick={() => copyToClipboard(alert.market_url)}>
                  Copy link
                </Button>
                <Button variant="secondary" size="sm" onClick={() => copyToClipboard(summary)}>
                  Copy summary
                </Button>
              </div>
            </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
