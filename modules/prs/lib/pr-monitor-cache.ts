import type { PrApiResponse, PrApiSuccess, PrSlackShareInfo } from "@/modules/prs/lib/domain";

const STORAGE_KEY = "pr-flow:last-sync";

export const PR_MONITOR_SYNC_UPDATED_EVENT = "pr-flow:monitor-sync-updated";

function isPrApiSuccess(value: unknown): value is PrApiSuccess {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as PrApiSuccess;
  return (
    candidate.status === "ok" &&
    typeof candidate.fetchedAt === "string" &&
    typeof candidate.githubLogin === "string" &&
    Array.isArray(candidate.data)
  );
}

export function loadPrMonitorLastSync(): PrApiSuccess | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return null;
    }

    const parsed: unknown = JSON.parse(raw);
    return isPrApiSuccess(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export function savePrMonitorLastSync(response: PrApiResponse): void {
  if (typeof window === "undefined" || response.status !== "ok") {
    return;
  }

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(response));
    window.dispatchEvent(new Event(PR_MONITOR_SYNC_UPDATED_EVENT));
  } catch {
    // Ignore quota or privacy mode errors.
  }
}

export function clearPrMonitorLastSync(): void {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(STORAGE_KEY);
}

export function patchPrSlackShareInMonitorCache(
  updates: Record<string, PrSlackShareInfo> | string,
  slackShare?: PrSlackShareInfo
): void {
  const cached = loadPrMonitorLastSync();
  if (!cached) {
    return;
  }

  const updatesByUrl =
    typeof updates === "string" && slackShare
      ? { [updates]: slackShare }
      : (updates as Record<string, PrSlackShareInfo>);

  savePrMonitorLastSync({
    ...cached,
    data: cached.data.map((pr) => {
      const nextShare = updatesByUrl[pr.url];
      return nextShare ? { ...pr, slackShare: nextShare } : pr;
    })
  });
}
