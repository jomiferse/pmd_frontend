"use client";

import { useCallback, useMemo, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useWindowVirtualizer } from "@tanstack/react-virtual";
import EmptyState from "../../components/EmptyState";
import MagicBadge from "../../components/magicui/MagicBadge";
import MagicButton from "../../components/magicui/MagicButton";
import MagicCard from "../../components/magicui/MagicCard";
import MagicNotice from "../../components/magicui/MagicNotice";
import MagicSkeleton from "../../components/magicui/MagicSkeleton";
import { apiClient } from "../../lib/apiClient";
import { formatProbability } from "../../lib/alertFormatters";
import type { AlertItem, CopilotRun } from "../../lib/types";
import type { SettingsResponse } from "../../lib/settings";
import { useSession } from "../../lib/useSession";

type AlertsPayload = {
  items: AlertItem[];
  total?: number | null;
  next_cursor?: string | null;
};

type SummaryCounts = {
  sent: number;
  skipped: number;
};

const DATE_RANGE_OPTIONS = [
  { value: "24h", label: "24h", minutes: 24 * 60 },
  { value: "7d", label: "7d", minutes: 7 * 24 * 60 }
] as const;

const FEED_PAGE_SIZE = 10;
const MAX_RATIONALE_LINES = 3;
const FEED_PREFERENCES_KEY = "copilot-feed-preferences-v1";
const FEED_STATE_KEY = "copilot-feed-state-v1";

type RecommendationState = "saved" | "dismissed" | "pending";
type DensityMode = "comfortable" | "compact";
type GroupingMode = "none" | "action" | "confidence";

function formatReasonCounts(counts: Record<string, number>) {
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6);
}

function formatTimestamp(value?: string | null) {
  if (!value) {
    return "Unknown time";
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return date.toLocaleString();
}

function formatCompactNumber(value?: number | null) {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return null;
  }
  return new Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: 1
  }).format(value);
}

function formatPercent(value?: number | null) {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return null;
  }
  return `${(value * 100).toFixed(1)}%`;
}

function extractRationaleLines(alert: AlertItem) {
  const message = (alert.message || "").trim();
  if (message) {
    return message
      .split(/\r?\n/)
      .map((line) => line.replace(/^[\s\-•*]+/, "").trim())
      .filter(Boolean)
      .slice(0, MAX_RATIONALE_LINES);
  }
  if (alert.filter_reasons?.length) {
    return alert.filter_reasons.slice(0, MAX_RATIONALE_LINES);
  }
  return [];
}

function formatWindowLabel(windowMinutes?: number | null) {
  if (!windowMinutes) {
    return "Window n/a";
  }
  return `Window ${windowMinutes}m`;
}

function resolveModeLabel(mode?: string | null) {
  if (!mode) {
    return "STANDARD";
  }
  return mode.toUpperCase();
}

function resolveDeliveryLabel(status?: string | null) {
  if (!status) {
    return "Pending";
  }
  if (status === "sent") {
    return "Sent to Telegram";
  }
  return "Not sent";
}

function isAlertsPayload(value: unknown): value is AlertsPayload {
  return Boolean(value && typeof value === "object" && "items" in value);
}

function getRecommendationKey(item: AlertItem) {
  if (item.id !== null && item.id !== undefined) {
    return `rec:${item.id}`;
  }
  return `rec:${item.market_url || "unknown"}:${item.created_at || "unknown"}`;
}

function loadFeedPreferences() {
  if (typeof window === "undefined") {
    return null;
  }
  try {
    const raw = window.localStorage.getItem(FEED_PREFERENCES_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as { density?: DensityMode; grouping?: GroupingMode; stateFilter?: "active" | "all" | "saved" | "dismissed" };
  } catch (error) {
    return null;
  }
}

function loadRecommendationState() {
  if (typeof window === "undefined") {
    return {};
  }
  try {
    const raw = window.localStorage.getItem(FEED_STATE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, RecommendationState>;
    return parsed || {};
  } catch (error) {
    return {};
  }
}

function saveRecommendationState(stateMap: Record<string, RecommendationState>) {
  if (typeof window === "undefined") {
    return;
  }
  try {
    window.localStorage.setItem(FEED_STATE_KEY, JSON.stringify(stateMap));
  } catch (error) {
    // ignore storage errors
  }
}

function formatTimeAgo(value: Date | null, nowMs: number) {
  if (!value) {
    return "Never";
  }
  const diffSeconds = Math.max(Math.floor((nowMs - value.getTime()) / 1000), 0);
  if (diffSeconds < 10) return "Just now";
  if (diffSeconds < 60) return `${diffSeconds}s ago`;
  const diffMinutes = Math.floor(diffSeconds / 60);
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
}

function isActionableRecommendation(item: AlertItem) {
  const action = (item.suggested_action || "").toUpperCase();
  return Boolean(action && action !== "IGNORE");
}

export default function CopilotPage() {
  const router = useRouter();
  const { data: session, loading: sessionLoading, error: sessionError } = useSession();
  const [runs, setRuns] = useState<CopilotRun[]>([]);
  const [feedItems, setFeedItems] = useState<AlertItem[]>([]);
  const [summaryCounts, setSummaryCounts] = useState<SummaryCounts>({ sent: 0, skipped: 0 });
  const [loading, setLoading] = useState(false);
  const [developerMode, setDeveloperMode] = useState(false);
  const [feedLoadingMore, setFeedLoadingMore] = useState(false);
  const [feedNextCursor, setFeedNextCursor] = useState<string | null>(null);
  const [feedTotalCount, setFeedTotalCount] = useState<number | null>(null);
  const [showLoadMoreFeed, setShowLoadMoreFeed] = useState(false);
  const [feedExhausted, setFeedExhausted] = useState(false);
  const [recommendationState, setRecommendationState] = useState<Record<string, RecommendationState>>({});
  const [stateHydrated, setStateHydrated] = useState(false);
  const [density, setDensity] = useState<DensityMode>("comfortable");
  const [grouping, setGrouping] = useState<GroupingMode>("none");
  const [groupCollapsed, setGroupCollapsed] = useState<Record<string, boolean>>({});
  const [expandedRationales, setExpandedRationales] = useState<Record<string, boolean>>({});
  const [lastUpdatedAt, setLastUpdatedAt] = useState<Date | null>(null);
  const [nowTick, setNowTick] = useState(Date.now());
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<"24h" | "7d" | "custom">("24h");
  const [customDays, setCustomDays] = useState(3);
  const [statusFilter, setStatusFilter] = useState<"all" | "sent" | "skipped">("all");
  const [stateFilter, setStateFilter] = useState<"active" | "all" | "saved" | "dismissed">("active");
  const [modeFilter, setModeFilter] = useState<"all" | "FAST" | "DIGEST">("all");
  const [actionFilter, setActionFilter] = useState<"all" | "FOLLOW" | "WATCH" | "WAIT" | "IGNORE">("all");
  const [actionableOnly, setActionableOnly] = useState(false);
  const [view, setView] = useState<"feed" | "runs">("feed");
  const [debugOpen, setDebugOpen] = useState(false);

  const windowMinutes = useMemo(() => {
    if (dateRange === "custom") {
      const safeDays = Number.isFinite(customDays) ? customDays : 1;
      return Math.max(safeDays, 1) * 24 * 60;
    }
    const option = DATE_RANGE_OPTIONS.find((item) => item.value === dateRange);
    return option?.minutes ?? 24 * 60;
  }, [dateRange, customDays]);

  const fetchFeedPage = useCallback(
    async ({
      cursor,
      append
    }: {
      cursor: string | null;
      append: boolean;
    }) => {
      if (sessionLoading) {
        return;
      }
      if (append) {
        setFeedLoadingMore(true);
      }
      const userId = session?.user?.id ?? undefined;
      const statusParam = statusFilter === "all" ? undefined : statusFilter;

  const feedResult = await apiClient.get<AlertsPayload>("/copilot/recommendations", {
    params: {
      limit: FEED_PAGE_SIZE,
      window_minutes: windowMinutes,
          user_id: userId,
          cursor: cursor ?? undefined,
          paginate: 1,
          include_total: append ? undefined : 1,
          copilot: statusParam
        },
        credentials: "include"
      });

  if (feedResult.status === 401) {
    router.replace("/login");
    setFeedLoadingMore(false);
    return;
  }
  if (!feedResult.ok && feedResult.status !== 404) {
    setError(feedResult.error || "Failed to load Copilot recommendations");
    if (!append) {
      setFeedItems([]);
      setFeedNextCursor(null);
      setFeedTotalCount(null);
      setFeedExhausted(false);
    }
    setFeedLoadingMore(false);
    return;
  }
  if (!feedResult.ok && feedResult.status === 404) {
    const legacyResult = await apiClient.get<AlertsPayload>("/alerts/latest", {
      params: {
        limit: FEED_PAGE_SIZE,
        window_minutes: windowMinutes,
        user_id: userId,
        cursor: cursor ?? undefined,
        paginate: 1,
        include_total: append ? undefined : 1,
        copilot: statusParam
      },
      credentials: "include"
    });
    if (legacyResult.status === 401) {
      router.replace("/login");
      setFeedLoadingMore(false);
      return;
    }
    if (!legacyResult.ok) {
      setError(legacyResult.error || "Failed to load Copilot recommendations");
      if (!append) {
        setFeedItems([]);
        setFeedNextCursor(null);
        setFeedTotalCount(null);
        setFeedExhausted(false);
      }
      setFeedLoadingMore(false);
      return;
    }
    if (isAlertsPayload(legacyResult.data)) {
      const items = legacyResult.data.items || [];
      setFeedItems((current) => (append ? [...current, ...items] : items));
      setFeedNextCursor(legacyResult.data.next_cursor ?? null);
      setFeedExhausted(items.length === 0 || !legacyResult.data.next_cursor);
      if (!append) {
        setFeedTotalCount(legacyResult.data.total ?? null);
        setLastUpdatedAt(new Date());
      }
    }
    setFeedLoadingMore(false);
    return;
  }

      if (isAlertsPayload(feedResult.data)) {
        const items = feedResult.data.items || [];
        setFeedItems((current) => (append ? [...current, ...items] : items));
        setFeedNextCursor(feedResult.data.next_cursor ?? null);
        setFeedExhausted(items.length === 0 || !feedResult.data.next_cursor);
        if (!append) {
          setFeedTotalCount(feedResult.data.total ?? null);
        }
        if (!append) {
          setLastUpdatedAt(new Date());
        }
      } else if (!append) {
        setFeedItems([]);
        setFeedNextCursor(null);
        setFeedTotalCount(null);
        setFeedExhausted(true);
      }
      setFeedLoadingMore(false);
    },
    [sessionLoading, session?.user?.id, router, windowMinutes, statusFilter]
  );

  const fetchData = useCallback(async () => {
    if (sessionLoading) {
      return;
    }
    setLoading(true);
    setError(null);
    const userId = session?.user?.id ?? undefined;
    const statusParam = statusFilter === "all" ? undefined : statusFilter;

    const [runsResult, feedResult, sentCountResult, skippedCountResult] = await Promise.all([
      apiClient.get<CopilotRun[]>("/copilot/runs", {
        params: {
          limit: 50,
          user_id: userId
        },
        credentials: "include"
      }),
      apiClient.get<AlertsPayload>("/copilot/recommendations", {
        params: {
          limit: FEED_PAGE_SIZE,
          window_minutes: windowMinutes,
          user_id: userId,
          paginate: 1,
          include_total: 1,
          copilot: statusParam
        },
        credentials: "include"
      }),
      apiClient.get<AlertsPayload>("/copilot/recommendations", {
        params: {
          limit: 1,
          window_minutes: windowMinutes,
          user_id: userId,
          paginate: 1,
          include_total: 1,
          copilot: "sent"
        },
        credentials: "include"
      }),
      apiClient.get<AlertsPayload>("/copilot/recommendations", {
        params: {
          limit: 1,
          window_minutes: windowMinutes,
          user_id: userId,
          paginate: 1,
          include_total: 1,
          copilot: "skipped"
        },
        credentials: "include"
      })
    ]);

    if (
      runsResult.status === 401 ||
      feedResult.status === 401 ||
      sentCountResult.status === 401 ||
      skippedCountResult.status === 401
    ) {
      router.replace("/login");
      setLoading(false);
      return;
    }

    if (!runsResult.ok) {
      setError(runsResult.error || "Failed to load Copilot runs");
      setRuns([]);
    } else {
      setRuns(runsResult.data || []);
    }

    if (!feedResult.ok && feedResult.status === 404) {
      const [legacyFeed, legacySent, legacySkipped] = await Promise.all([
        apiClient.get<AlertsPayload>("/alerts/latest", {
          params: {
            limit: FEED_PAGE_SIZE,
            window_minutes: windowMinutes,
            user_id: userId,
            paginate: 1,
            include_total: 1,
            copilot: statusParam
          },
          credentials: "include"
        }),
        apiClient.get<AlertsPayload>("/alerts/latest", {
          params: {
            limit: 1,
            window_minutes: windowMinutes,
            user_id: userId,
            paginate: 1,
            include_total: 1,
            copilot: "sent"
          },
          credentials: "include"
        }),
        apiClient.get<AlertsPayload>("/alerts/latest", {
          params: {
            limit: 1,
            window_minutes: windowMinutes,
            user_id: userId,
            paginate: 1,
            include_total: 1,
            copilot: "skipped"
          },
          credentials: "include"
        })
      ]);

      if (legacyFeed.ok && isAlertsPayload(legacyFeed.data)) {
        setFeedItems(legacyFeed.data.items || []);
        setFeedNextCursor(legacyFeed.data.next_cursor ?? null);
        setFeedTotalCount(legacyFeed.data.total ?? null);
        setFeedExhausted(legacyFeed.data.items.length === 0 || !legacyFeed.data.next_cursor);
      } else {
        setFeedItems([]);
        setFeedNextCursor(null);
        setFeedTotalCount(null);
        setFeedExhausted(true);
      }

      const legacySentTotal = legacySent.ok && isAlertsPayload(legacySent.data)
        ? Number(legacySent.data.total || 0)
        : 0;
      const legacySkippedTotal = legacySkipped.ok && isAlertsPayload(legacySkipped.data)
        ? Number(legacySkipped.data.total || 0)
        : 0;
      setSummaryCounts({ sent: legacySentTotal, skipped: legacySkippedTotal });
      setLoading(false);
      setLastUpdatedAt(new Date());
      return;
    }

    if (!feedResult.ok) {
      if (feedResult.status !== 404) {
        setError(feedResult.error || "Failed to load Copilot recommendations");
      }
      setFeedItems([]);
      setFeedNextCursor(null);
      setFeedTotalCount(null);
      setFeedExhausted(false);
    } else if (isAlertsPayload(feedResult.data)) {
      setFeedItems(feedResult.data.items || []);
      setFeedNextCursor(feedResult.data.next_cursor ?? null);
      setFeedTotalCount(feedResult.data.total ?? null);
      setFeedExhausted(feedResult.data.items.length === 0 || !feedResult.data.next_cursor);
    } else {
      setFeedItems([]);
      setFeedNextCursor(null);
      setFeedTotalCount(null);
      setFeedExhausted(true);
    }

    const sentTotal = sentCountResult.ok && isAlertsPayload(sentCountResult.data)
      ? Number(sentCountResult.data.total || 0)
      : 0;
    const skippedTotal = skippedCountResult.ok && isAlertsPayload(skippedCountResult.data)
      ? Number(skippedCountResult.data.total || 0)
      : 0;
    setSummaryCounts({ sent: sentTotal, skipped: skippedTotal });
    setLoading(false);
    setLastUpdatedAt(new Date());
  }, [sessionLoading, session?.user?.id, router, windowMinutes, statusFilter]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    const prefs = loadFeedPreferences();
    if (prefs?.density) {
      setDensity(prefs.density);
    }
    if (prefs?.grouping) {
      setGrouping(prefs.grouping);
    }
    if (prefs?.stateFilter) {
      setStateFilter(prefs.stateFilter);
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    const payload = JSON.stringify({ density, grouping, stateFilter });
    window.localStorage.setItem(FEED_PREFERENCES_KEY, payload);
  }, [density, grouping, stateFilter]);

  useEffect(() => {
    setRecommendationState(loadRecommendationState());
    setStateHydrated(true);
  }, []);

  useEffect(() => {
    if (!stateHydrated) {
      return;
    }
    saveRecommendationState(recommendationState);
  }, [recommendationState, stateHydrated]);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setNowTick(Date.now());
    }, 30000);
    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    if (sessionLoading) {
      return;
    }
    apiClient.get<SettingsResponse>("/settings/me", { credentials: "include" })
      .then((result) => {
        if (result.status === 401) {
          router.replace("/login");
          return;
        }
        if (!result.ok || !result.data) {
          return;
        }
        setDeveloperMode(Boolean(result.data.user?.developer_mode));
      });
  }, [sessionLoading, router]);

  useEffect(() => {
    if (!developerMode) {
      setView("feed");
      setDebugOpen(false);
      return;
    }
    setView("runs");
  }, [developerMode]);

  const updateRecommendationState = useCallback(
    (key: string, nextState: RecommendationState) => {
      setRecommendationState((current) => {
        const updated = { ...current };
        if (nextState === "pending") {
          delete updated[key];
          return updated;
        }
        updated[key] = nextState;
        return updated;
      });
    },
    []
  );

  const bulkUpdateState = useCallback(
    (items: AlertItem[], nextState: RecommendationState) => {
      if (!items.length) {
        return;
      }
      setRecommendationState((current) => {
        const updated = { ...current };
        items.forEach((item) => {
          const key = getRecommendationKey(item);
          if (nextState === "pending") {
            delete updated[key];
          } else {
            updated[key] = nextState;
          }
        });
        return updated;
      });
    },
    []
  );

  const filteredFeed = useMemo(() => {
    const filtered = feedItems.filter((item) => {
      if (statusFilter === "sent") {
        return item.delivery_status === "sent";
      }
      if (statusFilter === "skipped") {
        return item.delivery_status !== "sent";
      }
      if (actionFilter !== "all") {
        const action = (item.suggested_action || "").toUpperCase();
        if (action !== actionFilter) {
          return false;
        }
      }
      const state = recommendationState[getRecommendationKey(item)] || "pending";
      if (stateFilter === "saved" && state !== "saved") {
        return false;
      }
      if (stateFilter === "dismissed" && state !== "dismissed") {
        return false;
      }
      if (stateFilter === "active" && state !== "pending") {
        return false;
      }
      if (actionableOnly && !isActionableRecommendation(item)) {
        return false;
      }
      return true;
    });

    if (stateFilter !== "all") {
      return filtered;
    }

    const stateRank = (item: AlertItem) => {
      const state = recommendationState[getRecommendationKey(item)] || "pending";
      if (state === "saved") return 1;
      if (state === "dismissed") return 2;
      return 0;
    };
    return [...filtered].sort((a, b) => {
      const rankDelta = stateRank(a) - stateRank(b);
      if (rankDelta !== 0) return rankDelta;
      const timeA = a.created_at ? new Date(a.created_at).getTime() : 0;
      const timeB = b.created_at ? new Date(b.created_at).getTime() : 0;
      return timeB - timeA;
    });
  }, [feedItems, statusFilter, actionFilter, actionableOnly, stateFilter, recommendationState]);

  const runsInRange = useMemo(() => {
    const cutoff = Date.now() - windowMinutes * 60 * 1000;
    return runs.filter((run) => {
      const createdAt = run.created_at ? new Date(run.created_at).getTime() : 0;
      return createdAt >= cutoff;
    });
  }, [runs, windowMinutes]);

  const filteredRuns = useMemo(() => {
    if (modeFilter === "all") {
      return runsInRange;
    }
    return runsInRange.filter((run) => {
      const mode = (run.mode || "").toLowerCase();
      if (modeFilter === "FAST") {
        return mode === "fast";
      }
      return mode === "digest" || mode === "standard";
    });
  }, [runsInRange, modeFilter]);

  const skipReasonSummary = useMemo(() => {
    const aggregated: Record<string, number> = {};
    runsInRange.forEach((run) => {
      Object.entries(run.skipped_by_reason_counts || {}).forEach(([reason, count]) => {
        aggregated[reason] = (aggregated[reason] || 0) + count;
      });
    });
    return formatReasonCounts(aggregated);
  }, [runsInRange]);

  const summaryRangeLabel = useMemo(() => {
    if (dateRange === "custom") {
      return `Last ${customDays} days`;
    }
    return dateRange === "24h" ? "Last 24 hours" : "Last 7 days";
  }, [dateRange, customDays]);

  const recommendationCount = summaryCounts.sent + summaryCounts.skipped;
  const topSkipReason = skipReasonSummary[0]?.[0] || "None";
  const canLoadMoreFeed =
    Boolean(feedNextCursor) &&
    !feedExhausted &&
    filteredFeed.length > 0 &&
    view === "feed";
  const handleLoadMoreFeed = useCallback(() => {
    if (loading || feedLoadingMore || !feedNextCursor) {
      return;
    }
    fetchFeedPage({ cursor: feedNextCursor, append: true });
  }, [loading, feedLoadingMore, feedNextCursor, fetchFeedPage]);

  useEffect(() => {
    if (view !== "feed") {
      return;
    }
    const target = document.getElementById("copilot-feed-load-more-sentinel");
    if (!target) {
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        setShowLoadMoreFeed(Boolean(entry?.isIntersecting));
      },
      { rootMargin: "800px 0px" }
    );
    observer.observe(target);
    return () => observer.disconnect();
  }, [view, filteredFeed.length, canLoadMoreFeed]);

  type FeedRow =
    | { type: "header"; key: string; label: string; count: number }
    | { type: "item"; key: string; item: AlertItem };

  const feedRows = useMemo(() => {
    if (grouping === "none") {
      return filteredFeed.map((item) => ({
        type: "item",
        key: getRecommendationKey(item),
        item
      })) as FeedRow[];
    }

    const groupOrder =
      grouping === "action"
        ? ["FOLLOW", "WATCH", "WAIT", "IGNORE", "UNKNOWN"]
        : ["HIGH", "MEDIUM", "LOW", "UNKNOWN"];

    const groupMap = new Map<string, AlertItem[]>();
    filteredFeed.forEach((item) => {
      let groupValue = "UNKNOWN";
      if (grouping === "action") {
        groupValue = (item.suggested_action || "UNKNOWN").toUpperCase();
      } else if (grouping === "confidence") {
        groupValue = (item.confidence || "UNKNOWN").toUpperCase();
      }
      if (!groupOrder.includes(groupValue)) {
        groupValue = "UNKNOWN";
      }
      if (!groupMap.has(groupValue)) {
        groupMap.set(groupValue, []);
      }
      groupMap.get(groupValue)?.push(item);
    });

    const rows: FeedRow[] = [];
    groupOrder.forEach((groupValue) => {
      const items = groupMap.get(groupValue);
      if (!items || items.length === 0) {
        return;
      }
      const headerKey = `${grouping}:${groupValue}`;
      rows.push({
        type: "header",
        key: headerKey,
        label: groupValue,
        count: items.length
      });
      if (groupCollapsed[headerKey]) {
        return;
      }
      items.forEach((item) => {
        rows.push({
          type: "item",
          key: getRecommendationKey(item),
          item
        });
      });
    });
    return rows;
  }, [filteredFeed, grouping, groupCollapsed]);

  const virtualizer = useWindowVirtualizer({
    count: feedRows.length,
    estimateSize: (index) => {
      const row = feedRows[index];
      if (!row || row.type === "header") {
        return 56;
      }
      return density === "compact" ? 170 : 230;
    },
    overscan: 6
  });

  const runCards = filteredRuns.map((run) => {
    const reasonCounts = formatReasonCounts(run.skipped_by_reason_counts || {});
    const windowMinutesValue =
      run.window_minutes || run.digest_window_minutes || (run as unknown as { window?: number }).window || 0;
    return (
      <MagicCard key={run.run_id} className="border border-white/70 bg-fog/70">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-slate">Run</p>
            <p className="text-sm font-semibold text-ink">{run.run_id}</p>
            <p className="text-xs text-slate">{formatTimestamp(run.created_at)}</p>
          </div>
          <div className="flex flex-wrap gap-2 text-xs">
            <span className="rounded-full bg-ink px-3 py-1 text-white">
              {resolveModeLabel(run.mode)}
            </span>
            <span className="rounded-full border border-slate/30 px-3 py-1 text-slate">
              {formatWindowLabel(windowMinutesValue)}
            </span>
            <span className="rounded-full bg-accent px-3 py-1 text-ink">
              Sent {run.sent || 0}
            </span>
          </div>
        </div>
        <div className="mt-3 grid gap-3 text-xs text-slate sm:grid-cols-3">
          <div className="rounded-xl bg-white p-3">
            <p className="text-[10px] uppercase tracking-[0.2em]">Items produced</p>
            <p className="mt-2 text-sm text-ink">{run.themes_selected || 0}</p>
            <p className="text-sm text-slate">Eligible {run.themes_eligible || 0}</p>
          </div>
          <div className="rounded-xl bg-white p-3">
            <p className="text-[10px] uppercase tracking-[0.2em]">Delivery</p>
            <p className="mt-2 text-sm text-ink">Sent {run.sent || 0}</p>
            <p className="text-sm text-ink">
              LLM {run.llm_calls_succeeded}/{run.llm_calls_attempted}
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

        {debugOpen && (
          <details className="mt-4 rounded-2xl border border-ink/10 bg-white/80 p-4 text-xs text-slate">
            <summary className="cursor-pointer text-sm font-semibold text-ink">
              Advanced / Debug
            </summary>
            <div className="mt-3 grid gap-3 text-xs text-slate sm:grid-cols-2">
              <div>
                <p className="text-[10px] uppercase tracking-[0.2em]">Caps</p>
                <p className="mt-2 text-sm text-ink">
                  Day {run.caps_remaining_day}/{run.daily_limit}
                </p>
                <p className="text-sm text-ink">
                  Hour {run.caps_remaining_hour}/{run.hourly_limit}
                </p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-[0.2em]">Internal counters</p>
                <p className="mt-2 text-sm text-ink">Themes total {run.themes_total || 0}</p>
                <p className="text-sm text-ink">Themes candidate {run.themes_candidate || 0}</p>
              </div>
            </div>
            <div className="mt-3 text-xs text-slate">
              <p>Telegram sends: {run.telegram_sends_succeeded}/{run.telegram_sends_attempted}</p>
              <p>LLM calls: {run.llm_calls_succeeded}/{run.llm_calls_attempted}</p>
            </div>
            <pre className="mt-3 overflow-auto rounded-xl bg-fog/60 p-3 text-[11px] text-ink">
              {JSON.stringify(run, null, 2)}
            </pre>
          </details>
        )}
      </MagicCard>
    );
  });

  return (
    <section className="space-y-6">
      <MagicCard>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-slate">{summaryRangeLabel}</p>
            <h2 className="text-xl font-semibold text-ink">Copilot Activity</h2>
            <p className="text-sm text-slate">
              Recommendations with clear outcomes, plus run diagnostics when you need them.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <MagicButton
              variant={view === "feed" ? "primary" : "ghost"}
              size="sm"
              onClick={() => setView("feed")}
            >
              Recommendations
            </MagicButton>
            {developerMode && (
              <>
                <MagicButton
                  variant={view === "runs" ? "primary" : "ghost"}
                  size="sm"
                  onClick={() => setView("runs")}
                >
                  Run summaries
                </MagicButton>
                <MagicButton
                  variant={debugOpen ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => setDebugOpen((value) => !value)}
                >
                  {debugOpen ? "Debug on" : "Debug off"}
                </MagicButton>
              </>
            )}
          </div>
        </div>

        {(sessionError || error) && (
          <div className="mt-4 space-y-2">
            {sessionError && <MagicNotice tone="error">{sessionError}</MagicNotice>}
            {error && <MagicNotice tone="error">{error}</MagicNotice>}
          </div>
        )}
        {developerMode && (
          <div className="mt-4">
            <MagicNotice tone="info">
              Developer mode enforces run summaries and keeps debug off.
            </MagicNotice>
          </div>
        )}

        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-white/70 bg-white/80 p-4">
            <p className="text-[10px] uppercase tracking-[0.2em] text-slate">Runs executed</p>
            <p className="mt-2 text-2xl font-semibold text-ink">{runsInRange.length}</p>
          </div>
          <div className="rounded-2xl border border-white/70 bg-white/80 p-4">
            <p className="text-[10px] uppercase tracking-[0.2em] text-slate">Recommendations produced</p>
            <p className="mt-2 text-2xl font-semibold text-ink">{recommendationCount}</p>
          </div>
          <div className="rounded-2xl border border-white/70 bg-white/80 p-4">
            <p className="text-[10px] uppercase tracking-[0.2em] text-slate">Sent to Telegram</p>
            <p className="mt-2 text-2xl font-semibold text-ink">{summaryCounts.sent}</p>
          </div>
          <div className="rounded-2xl border border-white/70 bg-white/80 p-4">
            <p className="text-[10px] uppercase tracking-[0.2em] text-slate">Skipped + top reason</p>
            <p className="mt-2 text-2xl font-semibold text-ink">{summaryCounts.skipped}</p>
            <p className="mt-1 text-xs text-slate">{topSkipReason}</p>
          </div>
        </div>
      </MagicCard>

      <MagicCard>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="text-xs text-slate">
            Last updated: <span className="font-semibold text-ink">{formatTimeAgo(lastUpdatedAt, nowTick)}</span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <MagicButton variant="secondary" size="sm" onClick={() => fetchData()} disabled={loading}>
              {loading ? "Refreshing..." : "Refresh"}
            </MagicButton>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex flex-wrap gap-2">
            {DATE_RANGE_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setDateRange(option.value)}
                className={`rounded-full border px-4 py-2 text-xs font-semibold transition ${
                  dateRange === option.value
                    ? "border-ink/40 bg-ink text-white"
                    : "border-ink/10 bg-white text-slate hover:border-ink/30"
                }`}
              >
                {option.label}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setDateRange("custom")}
              className={`rounded-full border px-4 py-2 text-xs font-semibold transition ${
                dateRange === "custom"
                  ? "border-ink/40 bg-ink text-white"
                  : "border-ink/10 bg-white text-slate hover:border-ink/30"
              }`}
            >
              Custom
            </button>
            {dateRange === "custom" && (
              <input
                type="number"
                min={1}
                max={30}
                value={customDays}
                onChange={(event) => {
                  const nextValue = Number(event.target.value);
                  setCustomDays(Number.isNaN(nextValue) ? 1 : nextValue);
                }}
                className="w-24 rounded-full border border-ink/10 bg-white px-3 py-2 text-xs text-ink focus:border-ink/40 focus:outline-none"
              />
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={stateFilter}
              onChange={(event) =>
                setStateFilter(event.target.value as "active" | "all" | "saved" | "dismissed")
              }
              className="rounded-full border border-ink/10 bg-white px-3 py-2 text-xs text-ink focus:border-ink/40 focus:outline-none"
            >
              <option value="active">State: Active</option>
              <option value="all">State: All</option>
              <option value="saved">State: Saved</option>
              <option value="dismissed">State: Dismissed</option>
            </select>
            <select
              value={modeFilter}
              onChange={(event) => setModeFilter(event.target.value as "all" | "FAST" | "DIGEST")}
              className="rounded-full border border-ink/10 bg-white px-3 py-2 text-xs text-ink focus:border-ink/40 focus:outline-none"
            >
              <option value="all">Mode: All</option>
              <option value="FAST">Mode: FAST</option>
              <option value="DIGEST">Mode: Digest</option>
            </select>
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value as "all" | "sent" | "skipped")}
              className="rounded-full border border-ink/10 bg-white px-3 py-2 text-xs text-ink focus:border-ink/40 focus:outline-none"
            >
              <option value="all">Status: All</option>
              <option value="sent">Status: Sent</option>
              <option value="skipped">Status: Not sent</option>
            </select>
            <select
              value={actionFilter}
              onChange={(event) =>
                setActionFilter(event.target.value as "all" | "FOLLOW" | "WATCH" | "WAIT" | "IGNORE")
              }
              className="rounded-full border border-ink/10 bg-white px-3 py-2 text-xs text-ink focus:border-ink/40 focus:outline-none"
            >
              <option value="all">Action: All</option>
              <option value="FOLLOW">Action: Follow</option>
              <option value="WATCH">Action: Watch</option>
              <option value="WAIT">Action: Wait</option>
              <option value="IGNORE">Action: Ignore</option>
            </select>
            <button
              type="button"
              onClick={() => setActionableOnly((value) => !value)}
              className={`rounded-full border px-4 py-2 text-xs font-semibold transition ${
                actionableOnly
                  ? "border-accent/60 bg-accent/30 text-ink"
                  : "border-ink/10 bg-white text-slate hover:border-ink/30"
              }`}
            >
              Actionable only
            </button>
          </div>
        </div>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate">
            <span>Density</span>
            <div className="flex items-center rounded-full border border-ink/10 bg-white px-1 py-1">
              <button
                type="button"
                onClick={() => setDensity("comfortable")}
                className={`rounded-full px-3 py-1 transition ${
                  density === "comfortable" ? "bg-ink text-white" : "text-slate hover:text-ink"
                }`}
              >
                Comfortable
              </button>
              <button
                type="button"
                onClick={() => setDensity("compact")}
                className={`rounded-full px-3 py-1 transition ${
                  density === "compact" ? "bg-ink text-white" : "text-slate hover:text-ink"
                }`}
              >
                Compact
              </button>
            </div>
            <span>Group</span>
            <div className="flex items-center rounded-full border border-ink/10 bg-white px-1 py-1">
              <button
                type="button"
                onClick={() => setGrouping("none")}
                className={`rounded-full px-3 py-1 transition ${
                  grouping === "none" ? "bg-ink text-white" : "text-slate hover:text-ink"
                }`}
              >
                None
              </button>
              <button
                type="button"
                onClick={() => setGrouping("action")}
                className={`rounded-full px-3 py-1 transition ${
                  grouping === "action" ? "bg-ink text-white" : "text-slate hover:text-ink"
                }`}
              >
                Action
              </button>
              <button
                type="button"
                onClick={() => setGrouping("confidence")}
                className={`rounded-full px-3 py-1 transition ${
                  grouping === "confidence" ? "bg-ink text-white" : "text-slate hover:text-ink"
                }`}
              >
                Confidence
              </button>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <button
              type="button"
              onClick={() => bulkUpdateState(filteredFeed, "dismissed")}
              className="rounded-full border border-ink/10 bg-white px-3 py-2 text-xs font-semibold text-ink transition hover:border-ink"
            >
              Dismiss all on page
            </button>
            <button
              type="button"
              onClick={() =>
                bulkUpdateState(filteredFeed.filter((item) => isActionableRecommendation(item)), "saved")
              }
              className="rounded-full border border-ink/10 bg-white px-3 py-2 text-xs font-semibold text-ink transition hover:border-ink"
            >
              Save all actionable
            </button>
          </div>
        </div>
        <p className="mt-3 text-xs text-slate">
          Mode filter applies to run summaries. Recommendation cards use delivery status and action signals.
        </p>
        <p className="mt-1 text-xs text-slate">
          Saved and dismissed states are stored locally on this device.
        </p>
      </MagicCard>

      {loading ? (
        <MagicCard>
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, index) => (
              <MagicSkeleton key={index} className="h-24 w-full" />
            ))}
          </div>
        </MagicCard>
      ) : view === "feed" ? (
        filteredFeed.length === 0 ? (
          <EmptyState
            title="No copilot recommendations yet"
            detail="Enable Copilot in Billing/Settings and check back after the next digest."
          />
        ) : (
          <div className="space-y-4">
            <div className="relative">
              <div style={{ height: `${virtualizer.getTotalSize()}px` }} className="relative">
                {virtualizer.getVirtualItems().map((virtualRow) => {
                  const row = feedRows[virtualRow.index];
                  if (!row) {
                    return null;
                  }
                  return (
                    <div
                      key={row.key}
                      data-index={virtualRow.index}
                      ref={virtualizer.measureElement}
                      className="absolute left-0 top-0 w-full pb-4"
                      style={{ transform: `translateY(${virtualRow.start}px)` }}
                    >
                      {row.type === "header" ? (
                        <button
                          type="button"
                          onClick={() =>
                            setGroupCollapsed((current) => ({
                              ...current,
                              [row.key]: !current[row.key]
                            }))
                          }
                          className="w-full rounded-2xl border border-white/70 bg-white/90 px-4 py-3 text-left text-xs text-slate shadow-soft"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] uppercase tracking-[0.2em] text-slate">
                              {row.label}
                            </span>
                            <span className="text-xs text-ink">
                              {row.count} items {groupCollapsed[row.key] ? "(collapsed)" : ""}
                            </span>
                          </div>
                        </button>
                      ) : (
                        (() => {
                          const item = row.item;
                          const recKey = getRecommendationKey(item);
                          const localState = recommendationState[recKey] || "pending";
                          const isCompact = density === "compact";
                          const isExpanded = Boolean(expandedRationales[recKey]);
                          const rationaleLines = extractRationaleLines(item);
                          const moveValue = item.delta_pct ?? item.move;
                          const moveLabel =
                            moveValue !== null && moveValue !== undefined ? `${moveValue.toFixed(2)}%` : null;
                            const probability = formatProbability(item);
                            const probabilityBadge =
                              probability.current === null || probability.current === undefined
                                ? null
                                : probability.compact;
                            const liquidityLabel = formatCompactNumber(item.liquidity);
                            const volumeLabel = formatCompactNumber(item.volume_24h);
                          const showPending = localState === "pending" && item.delivery_status !== "sent";
                          const rationaleToShow =
                            isCompact && !isExpanded ? rationaleLines.slice(0, 1) : rationaleLines;
                          return (
                              <MagicCard
                                className={`border border-white/70 bg-fog/70 ${isCompact ? "p-4" : "p-6"}`}
                              >
                              <div className="flex flex-wrap items-start justify-between gap-3">
                                <div>
                                  <p className="text-xs uppercase tracking-[0.2em] text-slate">Recommendation</p>
                                  <a
                                    href={item.market_url}
                                    className="mt-1 block text-base font-semibold text-ink hover:underline"
                                    target="_blank"
                                    rel="noreferrer"
                                  >
                                    {item.title}
                                  </a>
                                  <p className="mt-1 text-xs text-slate">{formatTimestamp(item.created_at)}</p>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                  {item.suggested_action && (
                                    <span className="rounded-full bg-ink px-3 py-1 text-xs font-semibold text-white">
                                      {item.suggested_action}
                                    </span>
                                  )}
                                  {item.confidence && (
                                    <span className="rounded-full border border-ink/20 px-3 py-1 text-xs text-slate">
                                      {item.confidence} confidence
                                    </span>
                                  )}
                                  {item.delivery_status === "sent" && (
                                    <span className="rounded-full bg-accent px-3 py-1 text-xs text-ink">
                                      Sent
                                    </span>
                                  )}
                                  {localState === "saved" && (
                                    <span className="rounded-full border border-ink/20 px-3 py-1 text-xs text-ink">
                                      Saved (local)
                                    </span>
                                  )}
                                  {localState === "dismissed" && (
                                    <span className="rounded-full border border-slate/30 px-3 py-1 text-xs text-slate">
                                      Dismissed (local)
                                    </span>
                                  )}
                                  {showPending && (
                                    <span className="rounded-full border border-slate/20 px-3 py-1 text-xs text-slate">
                                      Pending
                                    </span>
                                  )}
                                </div>
                              </div>

                              <div className={`mt-3 flex flex-wrap gap-2 text-xs text-slate ${isCompact ? "" : "mt-4"}`}>
                                {moveLabel && <MagicBadge>Move {moveLabel}</MagicBadge>}
                                  {probabilityBadge && <MagicBadge>{probabilityBadge}</MagicBadge>}
                                {liquidityLabel && <MagicBadge>Liquidity {liquidityLabel}</MagicBadge>}
                                {volumeLabel && <MagicBadge>Volume {volumeLabel}</MagicBadge>}
                              </div>

                              <div className={isCompact ? "mt-3" : "mt-4"}>
                                <p className="text-[10px] uppercase tracking-[0.2em] text-slate">
                                  Why this was recommended
                                </p>
                                {rationaleToShow.length ? (
                                  <ul className={`mt-2 list-disc space-y-1 pl-5 ${isCompact ? "text-xs" : "text-sm"} text-ink`}>
                                    {rationaleToShow.map((line) => (
                                      <li key={line}>{line}</li>
                                    ))}
                                  </ul>
                                ) : (
                                  <p className={`mt-2 ${isCompact ? "text-xs" : "text-sm"} text-slate`}>
                                    No rationale was provided.
                                  </p>
                                )}
                                {isCompact && rationaleLines.length > 1 && (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setExpandedRationales((current) => ({
                                        ...current,
                                        [recKey]: !current[recKey]
                                      }))
                                    }
                                    className="mt-2 text-xs font-semibold text-ink underline underline-offset-4"
                                  >
                                    {isExpanded ? "Show less" : "Show more"}
                                  </button>
                                )}
                              </div>

                              <div className={`mt-4 flex flex-wrap items-center gap-2 ${isCompact ? "text-xs" : "text-sm"}`}>
                                <a
                                  href={item.market_url}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="inline-flex items-center justify-center rounded-full bg-ink px-4 py-2 text-xs font-semibold text-white shadow-soft transition hover:-translate-y-0.5 hover:shadow-card"
                                >
                                  Open market
                                </a>
                                <button
                                  type="button"
                                  onClick={() =>
                                    updateRecommendationState(recKey, localState === "saved" ? "pending" : "saved")
                                  }
                                  className="rounded-full border border-ink/10 bg-white px-3 py-2 text-xs font-semibold text-ink transition hover:border-ink"
                                >
                                  {localState === "saved" ? "Unsave" : "Save"}
                                </button>
                                <button
                                  type="button"
                                  onClick={() =>
                                    updateRecommendationState(recKey, localState === "dismissed" ? "pending" : "dismissed")
                                  }
                                  className="rounded-full border border-slate/20 bg-white px-3 py-2 text-xs font-semibold text-slate transition hover:border-slate/60"
                                >
                                  {localState === "dismissed" ? "Restore" : "Dismiss"}
                                </button>
                              </div>

                              {debugOpen && (
                                <details className="mt-4 rounded-2xl border border-ink/10 bg-white/80 p-4 text-xs text-slate">
                                  <summary className="cursor-pointer text-sm font-semibold text-ink">
                                    Advanced / Debug
                                  </summary>
                                  <div className="mt-3 space-y-2">
                                    <p>Alert ID: {item.id}</p>
                                    <p>Delivery status: {item.delivery_status || "unknown"}</p>
                                    {item.filter_reasons?.length ? (
                                      <p>Filter reasons: {item.filter_reasons.join(", ")}</p>
                                    ) : (
                                      <p>Filter reasons: none</p>
                                    )}
                                    <pre className="overflow-auto rounded-xl bg-fog/60 p-3 text-[11px] text-ink">
                                      {JSON.stringify(item, null, 2)}
                                    </pre>
                                  </div>
                                </details>
                              )}
                            </MagicCard>
                          );
                        })()
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
            <div id="copilot-feed-load-more-sentinel" className="h-1" />
          </div>
        )
      ) : filteredRuns.length === 0 ? (
        <EmptyState title="No Copilot runs yet" detail="Runs appear after digest processing." />
      ) : (
        <div className="grid gap-4">{runCards}</div>
      )}

      {view === "feed" && debugOpen && (
        <section className="space-y-3">
          <MagicCard>
            <h3 className="text-base font-semibold text-ink">Run diagnostics</h3>
            <p className="text-sm text-slate">
              Detailed run IDs, caps, skip reasons, and raw payloads for troubleshooting.
            </p>
          </MagicCard>
          {filteredRuns.length === 0 ? (
            <EmptyState title="No runs in this range" detail="Adjust the date range to see run details." />
          ) : (
            <div className="grid gap-4">{runCards}</div>
          )}
        </section>
      )}

      {!loading && error && (
        <MagicCard>
          <MagicNotice tone="error">{error}</MagicNotice>
          <div className="mt-4">
            <MagicButton variant="secondary" size="sm" onClick={() => fetchData()}>
              Retry
            </MagicButton>
          </div>
        </MagicCard>
      )}

      {view === "feed" && canLoadMoreFeed && showLoadMoreFeed && (
        <div className="fixed bottom-6 left-1/2 z-40 -translate-x-1/2">
          <div className="flex items-center gap-2 rounded-full border border-white/70 bg-white/90 px-2 py-2 shadow-card backdrop-blur">
            <MagicButton
              variant="secondary"
              size="sm"
              onClick={handleLoadMoreFeed}
              disabled={feedLoadingMore}
            >
              {feedLoadingMore ? "Loading more..." : "Load more"}
            </MagicButton>
          </div>
        </div>
      )}
    </section>
  );
}
