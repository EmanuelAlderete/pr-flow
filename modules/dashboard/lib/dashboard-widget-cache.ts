import type { DashboardBriefingResponse } from "@/modules/dashboard/lib/dashboard-briefing-types";
import type { DashboardHubStats } from "@/modules/dashboard/lib/dashboard-hub-stats";

export const DASHBOARD_WIDGET_CACHE_TTL_MS = 5 * 60 * 1000;

const HUB_STATS_CACHE_KEY = "pr-flow:dashboard-hub-stats-v1";
const BRIEFING_CACHE_PREFIX = "pr-flow:dashboard-briefing-v1:";
/** Chave de sessionStorage antes da renomeação briefing (item 8). */
const LEGACY_BRIEFING_CACHE_PREFIX = "pr-flow:dashboard-daily-summary-v1:";

type Timestamped<T> = {
  value: T;
  cachedAt: number;
};

function isTimestamped<T>(value: unknown, validate: (payload: unknown) => payload is T): value is Timestamped<T> {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Timestamped<T>;
  return typeof candidate.cachedAt === "number" && validate(candidate.value);
}

function isHubStats(value: unknown): value is DashboardHubStats {
  if (!value || typeof value !== "object") {
    return false;
  }

  const stats = value as DashboardHubStats;
  return (
    (stats.openPrs === null || typeof stats.openPrs === "number") &&
    (stats.openTasks === null || typeof stats.openTasks === "number") &&
    (stats.overdueTasks === null || typeof stats.overdueTasks === "number") &&
    (stats.pendingReviews === null || typeof stats.pendingReviews === "number") &&
    (stats.jiraSprintTickets === null || typeof stats.jiraSprintTickets === "number") &&
    (stats.jiraSprintLabel === null || typeof stats.jiraSprintLabel === "string")
  );
}

function isCacheableBriefing(value: unknown): value is DashboardBriefingResponse {
  if (!value || typeof value !== "object" || !("status" in value)) {
    return false;
  }

  const status = (value as DashboardBriefingResponse).status;
  return status === "ok" || status === "not_generated";
}

function readTimestamped<T>(
  key: string,
  validate: (payload: unknown) => payload is T,
  ttlMs: number = DASHBOARD_WIDGET_CACHE_TTL_MS
): T | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const raw = window.sessionStorage.getItem(key);
    if (!raw) {
      return null;
    }

    const parsed: unknown = JSON.parse(raw);
    if (!isTimestamped(parsed, validate)) {
      return null;
    }

    if (Date.now() - parsed.cachedAt > ttlMs) {
      return null;
    }

    return parsed.value;
  } catch {
    return null;
  }
}

function writeTimestamped<T>(key: string, value: T): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    const payload: Timestamped<T> = {
      value,
      cachedAt: Date.now()
    };
    window.sessionStorage.setItem(key, JSON.stringify(payload));
  } catch {
    // Ignore quota or privacy mode errors.
  }
}

export function loadDashboardHubStatsCache(): DashboardHubStats | null {
  return readTimestamped(HUB_STATS_CACHE_KEY, isHubStats);
}

export function saveDashboardHubStatsCache(stats: DashboardHubStats): void {
  writeTimestamped(HUB_STATS_CACHE_KEY, stats);
}

export function clearDashboardHubStatsCache(): void {
  if (typeof window === "undefined") {
    return;
  }

  window.sessionStorage.removeItem(HUB_STATS_CACHE_KEY);
}

export function loadDashboardBriefingCache(day: string): DashboardBriefingResponse | null {
  const key = `${BRIEFING_CACHE_PREFIX}${day}`;
  const cached = readTimestamped(key, isCacheableBriefing);
  if (cached) {
    return cached;
  }

  const legacy = readTimestamped(`${LEGACY_BRIEFING_CACHE_PREFIX}${day}`, isCacheableBriefing);
  if (legacy) {
    saveDashboardBriefingCache(day, legacy);
    if (typeof window !== "undefined") {
      window.sessionStorage.removeItem(`${LEGACY_BRIEFING_CACHE_PREFIX}${day}`);
    }
    return legacy;
  }

  return null;
}

export function saveDashboardBriefingCache(day: string, response: DashboardBriefingResponse): void {
  if (!isCacheableBriefing(response)) {
    return;
  }

  writeTimestamped(`${BRIEFING_CACHE_PREFIX}${day}`, response);
}

export function clearDashboardBriefingCache(day: string): void {
  if (typeof window === "undefined") {
    return;
  }

  window.sessionStorage.removeItem(`${BRIEFING_CACHE_PREFIX}${day}`);
}
