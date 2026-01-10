"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import AlertDrawer from "../../components/AlertDrawer";
import EmptyState from "../../components/EmptyState";
import MagicCard from "../../components/magicui/MagicCard";
import MagicNotice from "../../components/magicui/MagicNotice";
import MagicSkeleton from "../../components/magicui/MagicSkeleton";
import { apiClient } from "../../lib/apiClient";
import type { AlertItem } from "../../lib/types";
import { useSession } from "../../lib/useSession";

const windowOptions = [
  { label: "15m", value: 15 },
  { label: "30m", value: 30 },
  { label: "60m", value: 60 },
  { label: "24h", value: 1440 }
];

export default function AlertsPage() {
  const router = useRouter();
  const { data: session, loading: sessionLoading, error: sessionError } = useSession();
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [selected, setSelected] = useState<AlertItem | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [windowMinutes, setWindowMinutes] = useState(1440);
  const [strength, setStrength] = useState("");
  const [category, setCategory] = useState("");
  const [copilot, setCopilot] = useState("");

  useEffect(() => {
    if (sessionLoading) {
      return;
    }
    setLoading(true);
    apiClient
      .get<AlertItem[]>("/alerts/latest", {
        params: {
          window_minutes: windowMinutes,
          limit: 200,
          strength,
          category,
          copilot,
          user_id: session?.user?.id ?? undefined
        },
        credentials: "include"
      })
      .then((result) => {
        if (result.status === 401) {
          router.replace("/login");
          return;
        }
        if (!result.ok) {
          setError(result.error || "Failed to load alerts");
          setAlerts([]);
        } else {
          setAlerts(result.data || []);
          setError(null);
        }
      })
      .finally(() => {
        setLoading(false);
      });
  }, [sessionLoading, windowMinutes, strength, category, copilot, session?.user?.id, router]);

  const strengthOptions = useMemo(() => {
    const values = new Set(alerts.map((alert) => alert.strength || alert.confidence).filter(Boolean) as string[]);
    return Array.from(values).sort();
  }, [alerts]);

  const categoryOptions = useMemo(() => {
    const values = new Set(alerts.map((alert) => alert.category).filter(Boolean));
    return Array.from(values).sort();
  }, [alerts]);

  return (
    <section className="space-y-4">
      <MagicCard>
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-xl font-semibold">Alerts & Themes</h2>
            <p className="text-sm text-slate">Last 24h activity with filter reasons.</p>
          </div>
          <div className="flex flex-wrap gap-2 text-sm">
            <select
              value={windowMinutes}
              onChange={(event) => setWindowMinutes(Number(event.target.value))}
              className="rounded-full border border-slate/20 bg-white/80 px-3 py-2 text-sm shadow-soft"
            >
              {windowOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  Window {option.label}
                </option>
              ))}
            </select>
            <select
              value={strength}
              onChange={(event) => setStrength(event.target.value)}
              className="rounded-full border border-slate/20 bg-white/80 px-3 py-2 text-sm shadow-soft"
            >
              <option value="">All strengths</option>
              {strengthOptions.map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
            <select
              value={category}
              onChange={(event) => setCategory(event.target.value)}
              className="rounded-full border border-slate/20 bg-white/80 px-3 py-2 text-sm shadow-soft"
            >
              <option value="">All categories</option>
              {categoryOptions.map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
            <select
              value={copilot}
              onChange={(event) => setCopilot(event.target.value)}
              className="rounded-full border border-slate/20 bg-white/80 px-3 py-2 text-sm shadow-soft"
            >
              <option value="">Copilot: all</option>
              <option value="sent">Copilot: sent</option>
              <option value="skipped">Copilot: skipped</option>
            </select>
          </div>
        </div>
        {sessionError && (
          <div className="mt-4">
            <MagicNotice tone="error">{sessionError}</MagicNotice>
          </div>
        )}
        {error && (
          <div className="mt-4">
            <MagicNotice tone="error">{error}</MagicNotice>
          </div>
        )}
      </MagicCard>

      <MagicCard>
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, index) => (
              <MagicSkeleton key={index} className="h-12 w-full" />
            ))}
          </div>
        ) : alerts.length === 0 ? (
          <EmptyState title="No alerts yet" detail="Check back after the next ingest cycle." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-separate border-spacing-y-2 text-left text-sm">
              <thead className="text-xs uppercase tracking-[0.2em] text-slate">
                <tr>
                  <th className="pb-2">Time</th>
                  <th className="pb-2">Theme</th>
                  <th className="pb-2">Strength</th>
                  <th className="pb-2">Move</th>
                  <th className="pb-2">Copilot</th>
                </tr>
              </thead>
              <tbody>
                {alerts.map((alert) => (
                  <tr
                    key={alert.id}
                    className="cursor-pointer rounded-xl bg-fog transition hover:bg-white"
                    onClick={() => setSelected(alert)}
                  >
                    <td className="rounded-l-xl px-3 py-3 text-xs text-slate">{alert.created_at}</td>
                    <td className="px-3 py-3">
                      <div className="font-semibold text-ink">{alert.title}</div>
                      <div className="text-xs text-slate">{alert.category}</div>
                    </td>
                    <td className="px-3 py-3 text-xs text-slate">
                      {alert.strength || alert.confidence || "n/a"}
                    </td>
                    <td className="px-3 py-3 text-xs text-slate">{alert.move?.toFixed(4)}</td>
                    <td className="rounded-r-xl px-3 py-3 text-xs text-slate">
                      {alert.delivery_status || "n/a"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </MagicCard>

      <AlertDrawer alert={selected} onClose={() => setSelected(null)} />
    </section>
  );
}
