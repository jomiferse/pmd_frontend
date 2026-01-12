"use client";

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import AlertDrawer from "../../components/AlertDrawer";
import EmptyState from "../../components/EmptyState";
import MagicBadge from "../../components/magicui/MagicBadge";
import MagicButton from "../../components/magicui/MagicButton";
import MagicCard from "../../components/magicui/MagicCard";
import MagicInput from "../../components/magicui/MagicInput";
import MagicNotice from "../../components/magicui/MagicNotice";
import MagicSkeleton from "../../components/magicui/MagicSkeleton";
import { apiClient } from "../../lib/apiClient";
import { formatNumber, formatPercent, formatTimestamp } from "../../lib/formatters";
import type { SettingsEntitlements } from "../../lib/settings";
import type { AlertItem } from "../../lib/types";
import { useSession } from "../../lib/useSession";
import {
  type AlertState,
  getAlertStateKey,
  getMoveDelta,
  getMoveValue,
  isActionableAlert,
  isFastAlert,
  loadAlertState,
  parseList,
  parseNumber,
  presetFromWindow,
  rangePresets,
  saveAlertState,
  sortOptions
} from "./alertUtils";

const storageKey = "alerts-filters-v1";
const viewStorageKey = "alerts-view-v1";
const pageSize = 50;


function AlertsPageContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { data: session, loading: sessionLoading, error: sessionError } = useSession();
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [selected, setSelected] = useState<AlertItem | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [entitlements, setEntitlements] = useState<SettingsEntitlements | null>(null);
  const [settingsError, setSettingsError] = useState<string | null>(null);
  const [alertState, setAlertState] = useState<Record<string, AlertState>>({});
  const [stateHydrated, setStateHydrated] = useState(false);
  const [stateFilter, setStateFilter] = useState<"active" | "all" | "saved" | "dismissed">("active");

  const [query, setQuery] = useState(searchParams.get("q") ?? "");
  const [strengths, setStrengths] = useState<string[]>(parseList(searchParams.get("strengths")));
  const [themes, setThemes] = useState<string[]>(parseList(searchParams.get("themes")));
  const [windowMinutes, setWindowMinutes] = useState(
    parseNumber(searchParams.get("window"), 24 * 60)
  );
  const [copilot, setCopilot] = useState(searchParams.get("copilot") ?? "");
  const [fastOnly, setFastOnly] = useState(searchParams.get("fast") === "1");
  const [actionableOnly, setActionableOnly] = useState(searchParams.get("actionable") === "1");
  const [minLiquidity, setMinLiquidity] = useState(searchParams.get("min_liquidity") ?? "");
  const [minVolume, setMinVolume] = useState(searchParams.get("min_volume_24h") ?? "");
  const [minMove, setMinMove] = useState(searchParams.get("min_move") ?? "");
  const [pMin, setPMin] = useState(searchParams.get("p_min") ?? "");
  const [pMax, setPMax] = useState(searchParams.get("p_max") ?? "");
  const [sort, setSort] = useState(searchParams.get("sort") ?? "newest");
  const [customWindowMinutes, setCustomWindowMinutes] = useState(String(windowMinutes));
  const [loadingMore, setLoadingMore] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState<number | null>(null);
  const [showLoadMore, setShowLoadMore] = useState(false);
  const [alertsHasMore, setAlertsHasMore] = useState(false);
  const [alertsHasMoreFiltered, setAlertsHasMoreFiltered] = useState(true);
  const [hasLoadedFromStorage, setHasLoadedFromStorage] = useState(false);
  const [themeOpen, setThemeOpen] = useState(false);
  const [themeQuery, setThemeQuery] = useState("");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [density, setDensity] = useState<"comfortable" | "compact">("comfortable");
  const [grouping, setGrouping] = useState<"none" | "date">("none");
  const [showBackToTop, setShowBackToTop] = useState(false);
  const themeRef = useRef<HTMLDivElement | null>(null);
  const [appliedServerFilters, setAppliedServerFilters] = useState(() => ({
    windowMinutes,
    strengths: strengths.slice(),
    themes: themes.slice(),
    copilot
  }));

  const fastAvailable = entitlements?.features.fast_signals_enabled ?? true;
  const allowedStrengths = useMemo(() => {
    const allowed = entitlements?.limits.alert_strengths.allowed_values;
    if (allowed && allowed.length) {
      return allowed;
    }
    const values = new Set(
      alerts.map((alert) => alert.strength || alert.confidence).filter(Boolean) as string[]
    );
    return Array.from(values).sort();
  }, [alerts, entitlements]);

  const themeOptions = useMemo(() => {
    const values = new Set(alerts.map((alert) => alert.category).filter(Boolean));
    return Array.from(values).sort();
  }, [alerts]);

  const filteredThemeOptions = useMemo(() => {
    const search = themeQuery.trim().toLowerCase();
    if (!search) return themeOptions;
    return themeOptions.filter((theme) => theme.toLowerCase().includes(search));
  }, [themeOptions, themeQuery]);

  const fetchAlertsPage = useCallback(
    ({
      cursor,
      append,
      includeTotal
    }: {
      cursor: string | null;
      append: boolean;
      includeTotal: boolean;
    }) => {
      if (sessionLoading) {
        return;
      }
      setError(null);
      if (append) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }

      const strengthParam =
        appliedServerFilters.strengths.length === 1 ? appliedServerFilters.strengths[0] : "";
      const categoryParam =
        appliedServerFilters.themes.length === 1 ? appliedServerFilters.themes[0] : "";

      apiClient
        .get<{
          items?: AlertItem[];
          next_cursor?: string | null;
          total?: number | null;
        } | AlertItem[]>("/alerts/latest", {
          params: {
            window_minutes: appliedServerFilters.windowMinutes,
            limit: pageSize,
            cursor: cursor ?? undefined,
            paginate: "1",
            include_total: includeTotal ? "1" : undefined,
            strength: strengthParam,
            category: categoryParam,
            copilot: appliedServerFilters.copilot,
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
            if (!append) {
              setAlerts([]);
              setNextCursor(null);
              setTotalCount(null);
              setAlertsHasMore(false);
            }
            return;
          }

          const data = result.data;
          const items = Array.isArray(data) ? data : data?.items ?? [];
          const next = Array.isArray(data) ? null : data?.next_cursor ?? null;
          const total = Array.isArray(data) ? null : data?.total ?? null;
          const matchedNewItems = items.filter(matchesAlertFilters).length;

          setAlerts((current) => {
            if (!append) return items;
            const merged = [...current, ...items];
            const seen = new Set<number | string>();
            return merged.filter((alert) => {
              const key = alert.id ?? `${alert.market_id}-${alert.created_at}`;
              if (seen.has(key)) return false;
              seen.add(key);
              return true;
            });
          });
          setNextCursor(next);
          if (append && items.length === 0) {
            setAlertsHasMore(false);
            setNextCursor(null);
          } else {
            setAlertsHasMore(Boolean(next));
          }
          if (append && matchedNewItems === 0) {
            setAlertsHasMoreFiltered(false);
          } else if (!append) {
            setAlertsHasMoreFiltered(true);
          }
          if (!append) {
            setTotalCount(total);
          } else if (total !== null && total !== undefined) {
            setTotalCount(total);
          }
          setError(null);
        })
        .finally(() => {
          if (append) {
            setLoadingMore(false);
          } else {
            setLoading(false);
          }
        });
    },
    [
      sessionLoading,
      appliedServerFilters.windowMinutes,
      appliedServerFilters.copilot,
      appliedServerFilters.strengths,
      appliedServerFilters.themes,
      session?.user?.id,
      router
    ]
  );

  useEffect(() => {
    setAlerts([]);
    setNextCursor(null);
    setTotalCount(null);
    setAlertsHasMore(false);
    setAlertsHasMoreFiltered(true);
    fetchAlertsPage({ cursor: null, append: false, includeTotal: true });
    window.scrollTo({ top: 0, behavior: "auto" });
  }, [fetchAlertsPage]);

  useEffect(() => {
    if (sessionLoading) {
      return;
    }
    apiClient
      .getEntitlements()
      .then((entitlementsResult) => {
        if (entitlementsResult.status === 401) {
          router.replace("/login");
          return;
        }
        if (!entitlementsResult.ok) {
          setSettingsError(entitlementsResult.error || "Plan entitlements unavailable");
          return;
        }
        setEntitlements(entitlementsResult.data);
      })
      .catch(() => {
        setSettingsError("Plan entitlements unavailable");
      });
  }, [sessionLoading, router]);

  useEffect(() => {
    if (hasLoadedFromStorage) return;
    const hasQueryParams = searchParams.toString().length > 0;
    if (hasQueryParams) {
      setHasLoadedFromStorage(true);
      return;
    }
    const raw = localStorage.getItem(storageKey);
    if (!raw) {
      setHasLoadedFromStorage(true);
      return;
    }
    try {
      const parsed = JSON.parse(raw) as {
        query: string;
        strengths: string[];
        themes: string[];
        windowMinutes: number;
        copilot: string;
        fastOnly: boolean;
        actionableOnly: boolean;
        minLiquidity: string;
        minVolume: string;
        minMove: string;
        pMin: string;
        pMax: string;
        sort: string;
      };
      setQuery(parsed.query || "");
      setStrengths(parsed.strengths || []);
      setThemes(parsed.themes || []);
      setWindowMinutes(parsed.windowMinutes || 24 * 60);
      setCustomWindowMinutes(String(parsed.windowMinutes || 24 * 60));
      setCopilot(parsed.copilot || "");
      setFastOnly(Boolean(parsed.fastOnly));
      setActionableOnly(Boolean(parsed.actionableOnly));
      setMinLiquidity(parsed.minLiquidity || "");
      setMinVolume(parsed.minVolume || "");
      setMinMove(parsed.minMove || "");
      setPMin(parsed.pMin || "");
      setPMax(parsed.pMax || "");
      setSort(parsed.sort || "newest");
    } catch (parseError) {
      // ignore storage errors
    } finally {
      setHasLoadedFromStorage(true);
    }
  }, [hasLoadedFromStorage, searchParams]);

  useEffect(() => {
    const raw = localStorage.getItem(viewStorageKey);
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw) as { density?: string; grouping?: string; stateFilter?: string };
      if (parsed.density === "compact") {
        setDensity("compact");
      }
      if (parsed.grouping === "date") {
        setGrouping("date");
      }
      if (parsed.stateFilter === "all" || parsed.stateFilter === "saved" || parsed.stateFilter === "dismissed") {
        setStateFilter(parsed.stateFilter);
      }
    } catch (parseError) {
      // ignore storage errors
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(viewStorageKey, JSON.stringify({ density, grouping, stateFilter }));
  }, [density, grouping, stateFilter]);

  useEffect(() => {
    setAlertState(loadAlertState());
    setStateHydrated(true);
  }, []);

  useEffect(() => {
    if (!stateHydrated) {
      return;
    }
    saveAlertState(alertState);
  }, [alertState, stateHydrated]);

  useEffect(() => {
    const handleScroll = () => {
      setShowBackToTop(window.scrollY > 600);
    };
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const persistFilters = useCallback(
    (payload: {
      query: string;
      strengths: string[];
      themes: string[];
      windowMinutes: number;
      copilot: string;
      fastOnly: boolean;
      actionableOnly: boolean;
      minLiquidity: string;
      minVolume: string;
      minMove: string;
      pMin: string;
      pMax: string;
      sort: string;
    }) => {
      const params = new URLSearchParams();
      if (payload.query) params.set("q", payload.query);
      if (payload.strengths.length) params.set("strengths", payload.strengths.join(","));
      if (payload.themes.length) params.set("themes", payload.themes.join(","));
      if (payload.windowMinutes !== 24 * 60) params.set("window", String(payload.windowMinutes));
      if (payload.copilot) params.set("copilot", payload.copilot);
      if (payload.fastOnly) params.set("fast", "1");
      if (payload.actionableOnly) params.set("actionable", "1");
      if (payload.minLiquidity) params.set("min_liquidity", payload.minLiquidity);
      if (payload.minVolume) params.set("min_volume_24h", payload.minVolume);
      if (payload.minMove) params.set("min_move", payload.minMove);
      if (payload.pMin) params.set("p_min", payload.pMin);
      if (payload.pMax) params.set("p_max", payload.pMax);
      if (payload.sort !== "newest") params.set("sort", payload.sort);

      const queryString = params.toString();
      const nextUrl = queryString ? `${pathname}?${queryString}` : pathname;
      router.replace(nextUrl, { scroll: false });
      localStorage.setItem(storageKey, JSON.stringify(payload));
    },
    [pathname, router]
  );

  useEffect(() => {
    if (!themeOpen) return;
    const handleClick = (event: MouseEvent) => {
      if (themeRef.current && !themeRef.current.contains(event.target as Node)) {
        setThemeOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [themeOpen]);

  const matchesAlertFilters = useCallback(
    (alert: AlertItem) => {
      const minLiquidityValue = minLiquidity ? Number(minLiquidity) : null;
      const minVolumeValue = minVolume ? Number(minVolume) : null;
      const minMoveValue = minMove ? Number(minMove) : null;
      const pMinValue = pMin ? Number(pMin) : null;
      const pMaxValue = pMax ? Number(pMax) : null;
      const search = query.trim().toLowerCase();
      const state = alertState[getAlertStateKey(alert)] || "pending";
      if (stateFilter === "saved" && state !== "saved") {
        return false;
      }
      if (stateFilter === "dismissed" && state !== "dismissed") {
        return false;
      }
      if (stateFilter === "active" && state !== "pending") {
        return false;
      }
      const strengthLabel = (alert.strength || alert.confidence || "").toLowerCase();
      if (strengths.length && !strengths.map((item) => item.toLowerCase()).includes(strengthLabel)) {
        return false;
      }
      if (themes.length && !themes.includes(alert.category)) {
        return false;
      }
      if (fastOnly && !isFastAlert(alert)) {
        return false;
      }
      if (actionableOnly && !isActionableAlert(alert)) {
        return false;
      }
      if (minLiquidityValue !== null && alert.liquidity < minLiquidityValue) {
        return false;
      }
      if (minVolumeValue !== null && alert.volume_24h < minVolumeValue) {
        return false;
      }
      if (minMoveValue !== null && getMoveValue(alert) < minMoveValue) {
        return false;
      }
      if (pMinValue !== null && alert.market_p_yes < pMinValue) {
        return false;
      }
      if (pMaxValue !== null && alert.market_p_yes > pMaxValue) {
        return false;
      }
      if (search) {
        const haystack = [
          alert.title,
          alert.category,
          alert.market_id,
          alert.market_slug,
          alert.market_url,
          alert.signal_type
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        if (!haystack.includes(search)) {
          return false;
        }
      }
      return true;
    },
    [
      minLiquidity,
      minVolume,
      minMove,
      pMin,
      pMax,
      query,
      alertState,
      stateFilter,
      strengths,
      themes,
      fastOnly,
      actionableOnly
    ]
  );

  const filteredAlerts = useMemo(() => {
    const filtered = alerts.filter(matchesAlertFilters);

    const sorted = [...filtered];
    sorted.sort((a, b) => {
      if (stateFilter === "all") {
        const stateRank = (item: AlertItem) => {
          const state = alertState[getAlertStateKey(item)] || "pending";
          if (state === "saved") return 1;
          if (state === "dismissed") return 2;
          return 0;
        };
        const rankDelta = stateRank(a) - stateRank(b);
        if (rankDelta !== 0) return rankDelta;
      }
      if (sort === "move") {
        return getMoveValue(b) - getMoveValue(a);
      }
      if (sort === "liquidity") {
        return b.liquidity - a.liquidity;
      }
      if (sort === "volume") {
        return b.volume_24h - a.volume_24h;
      }
      if (sort === "closest") {
        const deltaA = Math.abs((a.market_p_yes ?? 0.5) - 0.5);
        const deltaB = Math.abs((b.market_p_yes ?? 0.5) - 0.5);
        return deltaA - deltaB;
      }
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

    return sorted;
  }, [
    alerts,
    matchesAlertFilters,
    sort,
    alertState,
    stateFilter
  ]);

  const loadedAlertKeys = useMemo(() => {
    return new Set(alerts.map((alert) => getAlertStateKey(alert)));
  }, [alerts]);

  const hasUnloadedStateMatches = useMemo(() => {
    if (stateFilter !== "saved" && stateFilter !== "dismissed") {
      return false;
    }
    return Object.entries(alertState).some(([key, value]) => {
      return value === stateFilter && !loadedAlertKeys.has(key);
    });
  }, [alertState, loadedAlertKeys, stateFilter]);

  const canLoadMore =
    alertsHasMore &&
    filteredAlerts.length > 0 &&
    (stateFilter === "saved" || stateFilter === "dismissed"
      ? hasUnloadedStateMatches
      : alertsHasMoreFiltered);

  const summaryText = useMemo(() => {
    const parts = [] as string[];
    if (query) parts.push(`Search "${query}"`);
    if (strengths.length) parts.push(`Strength: ${strengths.join(", ")}`);
    if (themes.length) parts.push(`Themes: ${themes.length}`);
    if (fastOnly) parts.push("FAST only");
    if (actionableOnly) parts.push("Actionable only");
    if (minLiquidity) parts.push(`Min liq: ${minLiquidity}`);
    if (minVolume) parts.push(`Min vol: ${minVolume}`);
    if (minMove) parts.push(`Min move: ${minMove}`);
    if (pMin || pMax) parts.push(`p: ${pMin || "0"}-${pMax || "1"}`);
    const windowLabel =
      rangePresets.find((preset) => preset.minutes === windowMinutes)?.label ??
      `Window ${windowMinutes}m`;
    parts.push(windowLabel);
    const sortLabel = sortOptions.find((option) => option.value === sort)?.label ?? "Newest";
    parts.push(`Sort: ${sortLabel}`);
    return parts.length ? parts.join(" | ") : "All alerts";
  }, [
    query,
    strengths,
    themes,
    fastOnly,
    actionableOnly,
    minLiquidity,
    minVolume,
    minMove,
    pMin,
    pMax,
    windowMinutes,
    sort
  ]);

  const toggleStrength = (value: string) => {
    setStrengths((current) =>
      current.includes(value) ? current.filter((item) => item !== value) : [...current, value]
    );
  };

  const toggleTheme = (value: string) => {
    setThemes((current) =>
      current.includes(value) ? current.filter((item) => item !== value) : [...current, value]
    );
  };

  const selectAllThemes = () => {
    setThemes(themeOptions);
  };

  const clearThemes = () => {
    setThemes([]);
  };

  const clearFilters = () => {
    const nextPayload = {
      query: "",
      strengths: [],
      themes: [],
      windowMinutes: 24 * 60,
      copilot: "",
      fastOnly: false,
      actionableOnly: false,
      minLiquidity: "",
      minVolume: "",
      minMove: "",
      pMin: "",
      pMax: "",
      sort: "newest"
    };
    setQuery(nextPayload.query);
    setStrengths(nextPayload.strengths);
    setThemes(nextPayload.themes);
    setWindowMinutes(nextPayload.windowMinutes);
    setCustomWindowMinutes(String(nextPayload.windowMinutes));
    setCopilot(nextPayload.copilot);
    setFastOnly(nextPayload.fastOnly);
    setActionableOnly(nextPayload.actionableOnly);
    setMinLiquidity(nextPayload.minLiquidity);
    setMinVolume(nextPayload.minVolume);
    setMinMove(nextPayload.minMove);
    setPMin(nextPayload.pMin);
    setPMax(nextPayload.pMax);
    setSort(nextPayload.sort);
    setAppliedServerFilters({
      windowMinutes: nextPayload.windowMinutes,
      strengths: nextPayload.strengths,
      themes: nextPayload.themes,
      copilot: nextPayload.copilot
    });
    persistFilters(nextPayload);
  };

  const applyFilters = () => {
    setAppliedServerFilters({
      windowMinutes,
      strengths: strengths.slice(),
      themes: themes.slice(),
      copilot
    });
    persistFilters({
      query,
      strengths,
      themes,
      windowMinutes,
      copilot,
      fastOnly,
      actionableOnly,
      minLiquidity,
      minVolume,
      minMove,
      pMin,
      pMax,
      sort
    });
  };

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

  const presetValue = presetFromWindow(windowMinutes);
  const serverFiltersDirty = useMemo(() => {
    const strengthKey = strengths.slice().sort().join("|");
    const appliedStrengthKey = appliedServerFilters.strengths.slice().sort().join("|");
    const themeKey = themes.slice().sort().join("|");
    const appliedThemeKey = appliedServerFilters.themes.slice().sort().join("|");
    return (
      appliedServerFilters.windowMinutes !== windowMinutes ||
      appliedServerFilters.copilot !== copilot ||
      strengthKey !== appliedStrengthKey ||
      themeKey !== appliedThemeKey
    );
  }, [appliedServerFilters, windowMinutes, copilot, strengths, themes]);
  const visibleThemeChips = themes.slice(0, 6);
  const extraThemeCount = Math.max(themes.length - visibleThemeChips.length, 0);
  const isCompact = density === "compact";
  const showingCount = filteredAlerts.length;
  const totalCountValue = totalCount ?? (canLoadMore ? null : alerts.length);
  const cardPadding = isCompact ? "p-3" : "p-4";
  const rowGap = isCompact ? "gap-2" : "gap-3";
  const statsTextClass = isCompact ? "text-[11px]" : "text-xs";
  const metaTextClass = isCompact ? "text-[11px] text-slate" : "text-xs text-slate";
  const listSpacingClass = isCompact ? "space-y-3" : "space-y-4";
  const pillClass = isCompact
    ? "rounded-full border border-slate/20 bg-white px-2 py-0.5 text-[11px] text-slate"
    : "rounded-full border border-slate/20 bg-white px-3 py-1 text-xs text-slate";
  const actionButtonClass = isCompact
    ? "rounded-full border border-slate/20 px-2.5 py-1 text-[11px] text-slate transition hover:border-ink hover:text-ink"
    : "rounded-full border border-slate/20 px-3 py-1 text-xs text-slate transition hover:border-ink hover:text-ink";
  const detailsButtonClass = isCompact
    ? "rounded-full border border-ink px-2.5 py-1 text-[11px] font-semibold text-ink transition hover:bg-ink hover:text-white"
    : "rounded-full border border-ink px-3 py-1 text-xs font-semibold text-ink transition hover:bg-ink hover:text-white";

  type AlertRow =
    | { type: "group"; id: string; label: string; count: number }
    | { type: "alert"; id: string; alert: AlertItem };

  const groupedRows = useMemo(() => {
    if (grouping === "none") {
      return filteredAlerts.map((alert) => ({
        type: "alert",
        id: `alert-${alert.id}`,
        alert
      })) as AlertRow[];
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);

    const buckets = {
      today: [] as AlertItem[],
      yesterday: [] as AlertItem[],
      older: [] as AlertItem[]
    };

    for (const alert of filteredAlerts) {
      const created = new Date(alert.created_at);
      if (Number.isNaN(created.getTime())) {
        buckets.older.push(alert);
        continue;
      }
      if (created >= today) {
        buckets.today.push(alert);
      } else if (created >= yesterday) {
        buckets.yesterday.push(alert);
      } else {
        buckets.older.push(alert);
      }
    }

    const rows: AlertRow[] = [];
    const pushGroup = (label: string, items: AlertItem[]) => {
      if (!items.length) return;
      rows.push({ type: "group", id: `group-${label.toLowerCase()}`, label, count: items.length });
      items.forEach((alert) => rows.push({ type: "alert", id: `alert-${alert.id}`, alert }));
    };

    pushGroup("Today", buckets.today);
    pushGroup("Yesterday", buckets.yesterday);
    pushGroup("Older", buckets.older);

    return rows;
  }, [filteredAlerts, grouping]);

  useEffect(() => {
    const target = document.getElementById("alerts-load-more-sentinel");
    if (!target) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        setShowLoadMore(Boolean(entry?.isIntersecting));
      },
      { rootMargin: "800px 0px" }
    );
    observer.observe(target);
    return () => observer.disconnect();
  }, [canLoadMore, groupedRows.length]);

  useEffect(() => {
    if (filteredAlerts.length === 0) {
      setShowLoadMore(false);
    }
  }, [filteredAlerts.length]);

  const handleLoadMore = () => {
    if (loading || loadingMore || !nextCursor || !alertsHasMore) return;
    fetchAlertsPage({ cursor: nextCursor, append: true, includeTotal: false });
  };

  const updateAlertState = useCallback((key: string, nextState: AlertState) => {
    setAlertState((current) => {
      const updated = { ...current };
      if (nextState === "pending") {
        delete updated[key];
        return updated;
      }
      updated[key] = nextState;
      return updated;
    });
  }, []);

  const bulkUpdateAlertState = useCallback((items: AlertItem[], nextState: AlertState) => {
    if (!items.length) {
      return;
    }
    setAlertState((current) => {
      const updated = { ...current };
      items.forEach((alert) => {
        const key = getAlertStateKey(alert);
        if (nextState === "pending") {
          delete updated[key];
        } else {
          updated[key] = nextState;
        }
      });
      return updated;
    });
  }, []);
  return (
    <section className="space-y-4">
      <div className="relative z-30">
        <MagicCard className="relative border border-white/70 bg-white/80 p-3 backdrop-blur overflow-visible">
          <div className="space-y-4">
            <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-lg font-semibold text-ink">Alerts</h2>
                <p className="text-sm text-slate">Scannable signals with personalized filters.</p>
              </div>
              <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate">
                <div className="flex items-center gap-2">
                  <span>Density</span>
                  <div className="flex items-center rounded-full border border-slate/30 bg-white px-1 py-1">
                    <button
                      type="button"
                      onClick={() => setDensity("comfortable")}
                      className={`rounded-full px-3 py-1 transition ${
                        density === "comfortable"
                          ? "bg-ink text-white"
                          : "text-slate hover:text-ink"
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
                </div>
                <div className="flex items-center gap-2">
                  <span>Group</span>
                  <div className="flex items-center rounded-full border border-slate/30 bg-white px-1 py-1">
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
                      onClick={() => setGrouping("date")}
                      className={`rounded-full px-3 py-1 transition ${
                        grouping === "date" ? "bg-ink text-white" : "text-slate hover:text-ink"
                      }`}
                    >
                      Date
                    </button>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex flex-col gap-2 rounded-2xl border border-white/70 bg-white/90 px-3 py-2 text-xs md:flex-row md:items-center md:justify-between">
              <div className="flex min-w-0 flex-wrap items-center gap-2 text-xs text-slate">
                <span className="font-semibold text-ink whitespace-nowrap">
                  {totalCountValue !== null
                    ? `Showing ${showingCount} of ${totalCountValue} alerts`
                    : `Showing ${showingCount}+ alerts`}
                </span>
                <span className="min-w-0 flex-1 text-slate md:truncate">{summaryText}</span>
                {serverFiltersDirty && <span className="text-warning">Unsaved changes</span>}
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <MagicButton
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowAdvanced((value) => !value)}
                >
                  {showAdvanced ? "Hide advanced" : "Advanced"}
                </MagicButton>
                <MagicButton
                  variant="secondary"
                  size="sm"
                  onClick={() => bulkUpdateAlertState(filteredAlerts, "dismissed")}
                >
                  Dismiss all on page
                </MagicButton>
                <MagicButton
                  variant="secondary"
                  size="sm"
                  onClick={() =>
                    bulkUpdateAlertState(filteredAlerts.filter((alert) => isActionableAlert(alert)), "saved")
                  }
                >
                  Save all actionable
                </MagicButton>
                <MagicButton
                  variant="primary"
                  size="sm"
                  disabled={!serverFiltersDirty}
                  onClick={applyFilters}
                >
                  Apply filters
                </MagicButton>
                <MagicButton variant="secondary" size="sm" onClick={clearFilters}>
                  Clear all
                </MagicButton>
              </div>
            </div>
            <div className="grid gap-1.5 sm:grid-cols-2 lg:grid-cols-4">
              <div className="sm:col-span-2 lg:col-span-2">
                <MagicInput
                  label="Search title, market, theme"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search alerts"
                />
              </div>
              <label className="block text-xs text-slate">
                State
                <span className="mt-2 flex items-center rounded-2xl border border-white/70 bg-white/90 px-3 py-2 shadow-soft">
                  <select
                    value={stateFilter}
                    onChange={(event) =>
                      setStateFilter(event.target.value as "active" | "all" | "saved" | "dismissed")
                    }
                    className="w-full bg-transparent text-sm text-ink outline-none"
                  >
                    <option value="active">Active</option>
                    <option value="all">All</option>
                    <option value="saved">Saved</option>
                    <option value="dismissed">Dismissed</option>
                  </select>
                </span>
              </label>
            <label className="block text-xs text-slate">
              Sort by
              <span className="mt-2 flex items-center rounded-2xl border border-white/70 bg-white/90 px-3 py-2 shadow-soft">
                <select
                  value={sort}
                  onChange={(event) => setSort(event.target.value)}
                  className="w-full bg-transparent text-sm text-ink outline-none"
                >
                  {sortOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </span>
            </label>
            <label className="block text-xs text-slate">
              Date range
              <span className="mt-2 flex items-center rounded-2xl border border-white/70 bg-white/90 px-3 py-2 shadow-soft">
                <select
                  value={presetValue}
                  onChange={(event) => {
                    const next = event.target.value;
                    if (next === "custom") {
                      setCustomWindowMinutes(String(windowMinutes));
                      return;
                    }
                    const preset = rangePresets.find((item) => item.id === next);
                    if (preset?.minutes) {
                      setWindowMinutes(preset.minutes);
                      setCustomWindowMinutes(String(preset.minutes));
                    }
                  }}
                  className="w-full bg-transparent text-sm text-ink outline-none"
                >
                  {rangePresets.map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </span>
            </label>
            <div ref={themeRef} className="relative z-30">
              <label className="block text-xs text-slate">
                Themes
                <button
                  type="button"
                  onClick={() => setThemeOpen((open) => !open)}
                  className="mt-2 flex w-full items-center justify-between rounded-2xl border border-white/70 bg-white/90 px-3 py-2 text-left text-sm text-ink shadow-soft"
                >
                  <span>{themes.length ? `${themes.length} selected` : "All themes"}</span>
                  <span className="text-xs text-slate">v</span>
                </button>
              </label>
              {themeOpen && (
                <div className="absolute right-0 top-full z-50 mt-2 w-full rounded-2xl border border-white/70 bg-white p-3 shadow-card">
                  <input
                    value={themeQuery}
                    onChange={(event) => setThemeQuery(event.target.value)}
                    placeholder="Search themes"
                    className="w-full rounded-xl border border-slate/20 px-3 py-2 text-sm text-ink outline-none"
                  />
                  <div className="mt-2 flex items-center justify-between text-xs text-slate">
                    <button type="button" onClick={selectAllThemes} className="hover:text-ink">
                      Select all
                    </button>
                    <button type="button" onClick={clearThemes} className="hover:text-ink">
                      Clear
                    </button>
                  </div>
                  <div className="mt-2 max-h-48 space-y-1 overflow-y-auto text-sm">
                    {filteredThemeOptions.length ? (
                      filteredThemeOptions.map((theme) => (
                        <label key={theme} className="flex items-center gap-2 text-sm text-ink">
                          <input
                            type="checkbox"
                            checked={themes.includes(theme)}
                            onChange={() => toggleTheme(theme)}
                          />
                          <span>{theme}</span>
                        </label>
                      ))
                    ) : (
                      <div className="text-xs text-slate">No themes found.</div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
            <span className="text-slate">Quick filters:</span>
            {allowedStrengths.map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => toggleStrength(value)}
                aria-pressed={strengths.includes(value)}
                className={`rounded-full border px-3 py-1 transition ${
                  strengths.includes(value)
                    ? "border-ink bg-ink text-white"
                    : "border-slate/30 bg-white text-slate"
                }`}
              >
                {value}
              </button>
            ))}
          </div>
          {themes.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
              {visibleThemeChips.map((theme) => (
                <button
                  key={theme}
                  type="button"
                  onClick={() => toggleTheme(theme)}
                  className="rounded-full border border-slate/30 bg-white px-2.5 py-1 text-slate transition hover:border-ink hover:text-ink"
                >
                  {theme} x
                </button>
              ))}
              {extraThemeCount > 0 && (
                <span className="text-xs text-slate">+{extraThemeCount} more</span>
              )}
            </div>
          )}
        </div>
        {sessionError && (
          <div className="mt-4">
            <MagicNotice tone="error">{sessionError}</MagicNotice>
          </div>
        )}
        {settingsError && (
          <div className="mt-4">
            <MagicNotice tone="warning">{settingsError}</MagicNotice>
          </div>
        )}
        <div className="mt-3 text-xs text-slate">
          Saved and dismissed states are stored locally on this device.
        </div>
        {error && (
          <div className="mt-4">
            <MagicNotice tone="error">{error}</MagicNotice>
          </div>
        )}
        </MagicCard>
      </div>

      {showAdvanced && (
        <MagicCard className="space-y-3 p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm font-semibold text-ink">Advanced filters</p>
            <div className="flex flex-wrap items-center gap-2" />
          </div>
          <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-4">
            <label className="block text-xs text-slate">
              Min liquidity
              <span className="mt-2 flex items-center rounded-2xl border border-white/70 bg-white/90 px-3 py-2 shadow-soft">
                <input
                  type="number"
                  min={0}
                  value={minLiquidity}
                  onChange={(event) => setMinLiquidity(event.target.value)}
                  placeholder="e.g. 1000"
                  className="w-full bg-transparent text-sm text-ink outline-none"
                />
              </span>
            </label>
            <label className="block text-xs text-slate">
              Min 24h volume
              <span className="mt-2 flex items-center rounded-2xl border border-white/70 bg-white/90 px-3 py-2 shadow-soft">
                <input
                  type="number"
                  min={0}
                  value={minVolume}
                  onChange={(event) => setMinVolume(event.target.value)}
                  placeholder="e.g. 500"
                  className="w-full bg-transparent text-sm text-ink outline-none"
                />
              </span>
            </label>
            <label className="block text-xs text-slate">
              Min abs move
              <span className="mt-2 flex items-center rounded-2xl border border-white/70 bg-white/90 px-3 py-2 shadow-soft">
                <input
                  type="number"
                  min={0}
                  step="0.001"
                  value={minMove}
                  onChange={(event) => setMinMove(event.target.value)}
                  placeholder="e.g. 0.02"
                  className="w-full bg-transparent text-sm text-ink outline-none"
                />
              </span>
            </label>
            <label className="block text-xs text-slate">
              Copilot delivery
              <span className="mt-2 flex items-center rounded-2xl border border-white/70 bg-white/90 px-3 py-2 shadow-soft">
                <select
                  value={copilot}
                  onChange={(event) => setCopilot(event.target.value)}
                  className="w-full bg-transparent text-sm text-ink outline-none"
                >
                  <option value="">All</option>
                  <option value="sent">Sent</option>
                  <option value="skipped">Skipped</option>
                </select>
              </span>
            </label>
            <label className="block text-xs text-slate">
              p_yes min
              <span className="mt-2 flex items-center rounded-2xl border border-white/70 bg-white/90 px-3 py-2 shadow-soft">
                <input
                  type="number"
                  min={0}
                  max={1}
                  step="0.01"
                  value={pMin}
                  onChange={(event) => setPMin(event.target.value)}
                  placeholder="0.0"
                  className="w-full bg-transparent text-sm text-ink outline-none"
                />
              </span>
            </label>
            <label className="block text-xs text-slate">
              p_yes max
              <span className="mt-2 flex items-center rounded-2xl border border-white/70 bg-white/90 px-3 py-2 shadow-soft">
                <input
                  type="number"
                  min={0}
                  max={1}
                  step="0.01"
                  value={pMax}
                  onChange={(event) => setPMax(event.target.value)}
                  placeholder="1.0"
                  className="w-full bg-transparent text-sm text-ink outline-none"
                />
              </span>
            </label>
            <label className="block text-xs text-slate">
              Window minutes
              <span className="mt-2 flex items-center rounded-2xl border border-white/70 bg-white/90 px-3 py-2 shadow-soft">
                <input
                  type="number"
                  min={1}
                  value={customWindowMinutes}
                  onChange={(event) => {
                    const nextValue = event.target.value;
                    setCustomWindowMinutes(nextValue);
                    const parsed = Number(nextValue);
                    if (Number.isFinite(parsed) && parsed > 0) {
                      setWindowMinutes(parsed);
                    }
                  }}
                  className="w-full bg-transparent text-sm text-ink outline-none"
                />
              </span>
              <p className="mt-1 text-[11px] text-slate">
                Current range: {presetValue === "custom" ? "Custom" : "Preset"}
              </p>
            </label>
            <div className="flex flex-col gap-2 text-xs text-slate">
              <span>Flags</span>
              <div className="flex flex-wrap gap-2">
                {fastAvailable && (
                  <button
                    type="button"
                    onClick={() => setFastOnly((value) => !value)}
                    aria-pressed={fastOnly}
                    className={`rounded-full border px-3 py-1 transition ${
                      fastOnly ? "border-ink bg-ink text-white" : "border-slate/30 bg-white text-slate"
                    }`}
                  >
                    FAST only
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setActionableOnly((value) => !value)}
                  aria-pressed={actionableOnly}
                  className={`rounded-full border px-3 py-1 transition ${
                    actionableOnly
                      ? "border-ink bg-ink text-white"
                      : "border-slate/30 bg-white text-slate"
                  }`}
                >
                  Actionable only
                </button>
              </div>
            </div>
          </div>
        </MagicCard>
      )}
      <MagicCard className="p-4">
        {error && (
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <MagicNotice tone="error">{error}</MagicNotice>
            <MagicButton
              variant="secondary"
              size="sm"
              onClick={() => fetchAlertsPage({ cursor: null, append: false, includeTotal: true })}
            >
              Retry
            </MagicButton>
          </div>
        )}
        {loading && !loadingMore ? (
          <div className="space-y-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <MagicSkeleton key={index} className="h-20 w-full" />
            ))}
          </div>
        ) : filteredAlerts.length === 0 ? (
          <EmptyState title="No alerts match these filters" detail="Try a broader window or fewer filters." />
        ) : (
          <div className="space-y-4">
            <div className={listSpacingClass}>
              {groupedRows.map((row) => {
                if (row.type === "group") {
                  return (
                    <div
                      key={row.id}
                      className="rounded-xl border border-white/70 bg-white/90 px-3 py-2 text-xs font-semibold text-slate"
                    >
                      {row.label}
                      <span className="ml-2 text-[11px] text-slate">({row.count})</span>
                    </div>
                  );
                }

                const alert = row.alert;
                const moveDelta = getMoveDelta(alert);
                const moveClass = moveDelta >= 0 ? "text-emerald-600" : "text-rose-600";
                const strengthLabel = alert.strength || alert.confidence || "n/a";
                const alertStateKey = getAlertStateKey(alert);
                const localState = alertState[alertStateKey] || "pending";
                return (
                  <div
                    key={row.id}
                    role="button"
                    tabIndex={0}
                    className={`rounded-2xl bg-fog text-left transition hover:bg-white ${cardPadding}`}
                    onClick={() => setSelected(alert)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        setSelected(alert);
                      }
                    }}
                  >
                    <div className={`flex flex-col md:flex-row md:items-center md:justify-between ${rowGap}`}>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-sm font-semibold text-ink">{alert.title}</span>
                          {isFastAlert(alert) && <MagicBadge>FAST</MagicBadge>}
                          {alert.signal_type && <MagicBadge>{alert.signal_type}</MagicBadge>}
                          {localState === "saved" && <MagicBadge>Saved (local)</MagicBadge>}
                          {localState === "dismissed" && <MagicBadge>Dismissed (local)</MagicBadge>}
                        </div>
                        <div className={`mt-1 ${metaTextClass}`}>
                          {alert.category || "Uncategorized"} - {alert.market_slug || alert.market_id} - Window{" "}
                          {windowMinutes}m - {formatTimestamp(alert.created_at)}
                        </div>
                        {alert.delivery_status && (
                          <div className={`mt-1 ${metaTextClass}`}>
                            Copilot: {alert.delivery_status}
                          </div>
                        )}
                      </div>
                      <div className={`flex flex-wrap items-center ${rowGap} ${statsTextClass}`}>
                        <span className={pillClass}>p_yes {formatPercent(alert.market_p_yes)}</span>
                        <span className={`${pillClass} ${moveClass}`}>
                          Move {formatPercent(alert.delta_pct ?? alert.move)}
                        </span>
                        <span className={pillClass}>Liq {formatNumber(alert.liquidity)}</span>
                        <MagicBadge>{strengthLabel}</MagicBadge>
                      </div>
                      <div className={`flex flex-wrap items-center ${rowGap}`}>
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            updateAlertState(alertStateKey, localState === "saved" ? "pending" : "saved");
                          }}
                          className={actionButtonClass}
                        >
                          {localState === "saved" ? "Unsave" : "Save"}
                        </button>
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            updateAlertState(alertStateKey, localState === "dismissed" ? "pending" : "dismissed");
                          }}
                          className={actionButtonClass}
                        >
                          {localState === "dismissed" ? "Restore" : "Dismiss"}
                        </button>
                        <a
                          href={alert.market_url}
                          target="_blank"
                          rel="noreferrer"
                          onClick={(event) => event.stopPropagation()}
                          className={actionButtonClass}
                        >
                          Open
                        </a>
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            copyToClipboard(alert.market_url);
                          }}
                          className={actionButtonClass}
                        >
                          Copy link
                        </button>
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            setSelected(alert);
                          }}
                          className={detailsButtonClass}
                        >
                          Details
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            <div id="alerts-load-more-sentinel" className="h-1" />
          </div>
        )}
      </MagicCard>

      <AlertDrawer alert={selected} windowMinutes={windowMinutes} onClose={() => setSelected(null)} />
      {((canLoadMore && showLoadMore) || showBackToTop) && (
        <div className="fixed bottom-6 left-1/2 z-40 -translate-x-1/2">
          <div className="flex items-center gap-2 rounded-full border border-white/70 bg-white/90 px-2 py-2 shadow-card backdrop-blur">
            {canLoadMore && showLoadMore && (
              <MagicButton
                variant="secondary"
                size="sm"
                onClick={handleLoadMore}
                disabled={loadingMore}
              >
                {loadingMore ? "Loading more..." : "Load more"}
              </MagicButton>
            )}
            {showBackToTop && (
              <MagicButton
                variant="primary"
                size="sm"
                onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
              >
                Back to top
              </MagicButton>
            )}
          </div>
        </div>
      )}
    </section>
  );
}

export default function AlertsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen" />}>
      <AlertsPageContent />
    </Suspense>
  );
}




