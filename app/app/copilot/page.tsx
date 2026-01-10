"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import EmptyState from "../../components/EmptyState";
import MagicCard from "../../components/magicui/MagicCard";
import MagicNotice from "../../components/magicui/MagicNotice";
import MagicSkeleton from "../../components/magicui/MagicSkeleton";
import { apiClient } from "../../lib/apiClient";
import type { CopilotRun } from "../../lib/types";
import { useSession } from "../../lib/useSession";

function formatReasonCounts(counts: Record<string, number>) {
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6);
}

export default function CopilotPage() {
  const router = useRouter();
  const { data: session, loading: sessionLoading, error: sessionError } = useSession();
  const [runs, setRuns] = useState<CopilotRun[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (sessionLoading) {
      return;
    }
    setLoading(true);
    apiClient
      .get<CopilotRun[]>("/copilot/runs", {
        params: {
          limit: 20,
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
          setError(result.error || "Failed to load Copilot runs");
          setRuns([]);
        } else {
          setRuns(result.data || []);
          setError(null);
        }
      })
      .finally(() => {
        setLoading(false);
      });
  }, [sessionLoading, session?.user?.id, router]);

  return (
    <section className="space-y-4">
      <MagicCard>
        <h2 className="text-xl font-semibold">Copilot Activity</h2>
        <p className="text-sm text-slate">Recent runs with caps and skip reason breakdowns.</p>
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
            {Array.from({ length: 4 }).map((_, index) => (
              <MagicSkeleton key={index} className="h-20 w-full" />
            ))}
          </div>
        ) : runs.length === 0 ? (
          <EmptyState title="No Copilot runs yet" detail="Runs appear after digest processing." />
        ) : (
          <div className="grid gap-4">
            {runs.map((run) => {
              const reasonCounts = formatReasonCounts(run.skipped_by_reason_counts || {});
              const windowMinutes = run.window_minutes || (run as unknown as { window?: number }).window || 0;
              return (
                <MagicCard key={run.run_id} className="border border-white/70 bg-fog/70">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="text-xs uppercase tracking-[0.2em] text-slate">Run</p>
                      <p className="text-sm font-semibold text-ink">{run.run_id}</p>
                      <p className="text-xs text-slate">{run.created_at}</p>
                    </div>
                    <div className="flex flex-wrap gap-2 text-xs">
                      <span className="rounded-full bg-ink px-3 py-1 text-white">
                        {run.mode || "STANDARD"}
                      </span>
                      <span className="rounded-full border border-slate/30 px-3 py-1 text-slate">
                        Window {windowMinutes}m
                      </span>
                      <span className="rounded-full bg-accent px-3 py-1 text-ink">
                        Sent {run.sent}
                      </span>
                    </div>
                  </div>
                  <div className="mt-3 grid gap-3 text-xs text-slate sm:grid-cols-3">
                    <div className="rounded-xl bg-white p-3">
                      <p className="text-[10px] uppercase tracking-[0.2em]">Caps</p>
                      <p className="mt-2 text-sm text-ink">
                        Day {run.caps_remaining_day}/{run.daily_limit}
                      </p>
                      <p className="text-sm text-ink">
                        Hour {run.caps_remaining_hour}/{run.hourly_limit}
                      </p>
                    </div>
                    <div className="rounded-xl bg-white p-3">
                      <p className="text-[10px] uppercase tracking-[0.2em]">LLM / Telegram</p>
                      <p className="mt-2 text-sm text-ink">
                        LLM {run.llm_calls_succeeded}/{run.llm_calls_attempted}
                      </p>
                      <p className="text-sm text-ink">
                        TG {run.telegram_sends_succeeded}/{run.telegram_sends_attempted}
                      </p>
                    </div>
                    <div className="rounded-xl bg-white p-3">
                      <p className="text-[10px] uppercase tracking-[0.2em]">Skip Reasons</p>
                      {reasonCounts.length ? (
                        <div className="mt-2 flex flex-wrap gap-2">
                          {reasonCounts.map(([reason, count]) => (
                            <span
                              key={reason}
                              className="rounded-full border border-slate/20 px-2 py-1 text-[11px]"
                            >
                              {reason} ({count})
                            </span>
                          ))}
                        </div>
                      ) : (
                        <p className="mt-2 text-sm text-slate">None</p>
                      )}
                    </div>
                  </div>
                </MagicCard>
              );
            })}
          </div>
        )}
      </MagicCard>
    </section>
  );
}
