"use client";

import type { AlertItem } from "../lib/types";

type Props = {
  alert: AlertItem | null;
  onClose: () => void;
};

export default function AlertDrawer({ alert, onClose }: Props) {
  if (!alert) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/40 p-4 sm:items-center">
      <div className="w-full max-w-xl rounded-2xl bg-white shadow-card">
        <div className="flex items-start justify-between border-b border-slate/10 p-5">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-slate">Alert Detail</p>
            <h2 className="mt-1 text-lg font-semibold text-ink">{alert.title}</h2>
            <p className="mt-1 text-xs text-slate">{alert.created_at}</p>
          </div>
          <button
            onClick={onClose}
            className="rounded-full border border-slate/20 px-3 py-1 text-xs text-slate transition hover:border-ink hover:text-ink"
          >
            Close
          </button>
        </div>
        <div className="grid gap-4 p-5 text-sm">
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-fog p-3">
              <p className="text-xs uppercase text-slate">Price Move</p>
              <p className="mt-1 text-base font-semibold text-ink">
                {alert.old_price ?? alert.prev_market_p_yes} → {alert.new_price ?? alert.market_p_yes}
              </p>
            </div>
            <div className="rounded-xl bg-fog p-3">
              <p className="text-xs uppercase text-slate">Move / Strength</p>
              <p className="mt-1 text-base font-semibold text-ink">
                {alert.move?.toFixed(4)} ({alert.strength || alert.confidence || "n/a"})
              </p>
            </div>
            <div className="rounded-xl bg-fog p-3">
              <p className="text-xs uppercase text-slate">Liquidity / Vol 24h</p>
              <p className="mt-1 text-base font-semibold text-ink">
                {alert.liquidity?.toFixed(2)} / {alert.volume_24h?.toFixed(2)}
              </p>
            </div>
            <div className="rounded-xl bg-fog p-3">
              <p className="text-xs uppercase text-slate">Sustained / Reversal</p>
              <p className="mt-1 text-base font-semibold text-ink">
                {alert.sustained} / {alert.reversal}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <span className="rounded-full bg-ink px-3 py-1 text-xs text-white">
              {alert.type}
            </span>
            {alert.delivery_status && (
              <span className="rounded-full bg-accent px-3 py-1 text-xs text-ink">
                {alert.delivery_status}
              </span>
            )}
            <span className="rounded-full border border-slate/30 px-3 py-1 text-xs text-slate">
              {alert.category}
            </span>
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
          <div>
            <p className="text-xs uppercase text-slate">Market Link</p>
            <a
              href={alert.market_url}
              target="_blank"
              rel="noreferrer"
              className="mt-2 inline-flex items-center gap-2 text-sm font-medium text-ink underline decoration-accent decoration-2 underline-offset-4"
            >
              Open market
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
