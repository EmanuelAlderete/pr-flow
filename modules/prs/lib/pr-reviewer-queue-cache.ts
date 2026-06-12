import type { ReviewerQueueApiResponse, ReviewerQueueApiSuccess } from "@/modules/prs/lib/domain";
import { PR_MONITOR_SYNC_UPDATED_EVENT } from "@/modules/prs/lib/pr-monitor-cache";

const STORAGE_KEY = "pr-flow:reviewer-queue-last-sync";

function isReviewerQueueApiSuccess(value: unknown): value is ReviewerQueueApiSuccess {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as ReviewerQueueApiSuccess;
  return (
    candidate.status === "ok" &&
    typeof candidate.fetchedAt === "string" &&
    typeof candidate.githubLogin === "string" &&
    Array.isArray(candidate.data)
  );
}

export function loadPrReviewerQueueLastSync(): ReviewerQueueApiSuccess | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return null;
    }

    const parsed: unknown = JSON.parse(raw);
    return isReviewerQueueApiSuccess(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export function savePrReviewerQueueLastSync(response: ReviewerQueueApiResponse): void {
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
