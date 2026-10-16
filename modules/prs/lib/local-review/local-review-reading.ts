import {
  loadPrMonitorCacheAllowStale,
  loadPrReviewerQueueCacheAllowStale
} from "@/modules/prs/lib/pr-cache-repository";
import { LOCAL_REVIEW_STALE_RUNNING_MS } from "@/modules/prs/lib/local-review/local-review-candidates";
import {
  localReviewReportSchema,
  type LocalReviewReport
} from "@/modules/prs/lib/local-review/local-review-report";
import { listLocalReviews } from "@/modules/prs/lib/local-review/local-review-repository";
import { localReviewUsageSchema, type LocalReviewUsage } from "@/modules/prs/lib/local-review/local-review-usage";
import { ptBR } from "@/modules/messages";

export type LocalReviewReading = {
  repository: string;
  prNumber: number;
  title: string | null;
  url: string | null;
  headSha: string;
  status: "ok" | "running" | "error";
  error: string | null;
  finishedAt: string | null;
  model: string;
  report: LocalReviewReport | null;
  usage: LocalReviewUsage | null;
};

export async function loadLocalReviewReading(
  repository: string,
  prNumber: number
): Promise<LocalReviewReading | null> {
  const rows = await listLocalReviews();
  const row = rows.find((item) => item.repository === repository && item.prNumber === prNumber);
  if (!row) {
    return null;
  }

  const [monitor, queue] = await Promise.all([
    loadPrMonitorCacheAllowStale(),
    loadPrReviewerQueueCacheAllowStale()
  ]);
  const pull = [...(monitor?.data ?? []), ...(queue?.data ?? [])].find(
    (item) => item.repository === repository && item.number === prNumber
  );

  const runningTooLong =
    row.status === "running" &&
    Date.now() - (row.updatedAt?.getTime() ?? 0) >= LOCAL_REVIEW_STALE_RUNNING_MS;
  const status = runningTooLong
    ? "error"
    : row.status === "ok" || row.status === "running" || row.status === "error"
      ? row.status
      : "error";

  let report: LocalReviewReport | null = null;
  if (status === "ok" && row.report) {
    try {
      const parsed = localReviewReportSchema.safeParse(JSON.parse(row.report));
      report = parsed.success ? parsed.data : null;
    } catch {
      report = null;
    }
  }

  return {
    repository,
    prNumber,
    title: pull?.title ?? null,
    url: pull?.url ?? null,
    headSha: row.headSha,
    status,
    error: runningTooLong ? ptBR.localReview.interrupted : row.error,
    finishedAt: row.finishedAt ? row.finishedAt.toISOString() : null,
    model: row.model,
    report,
    usage: usageFromRow(row.usage)
  };
}

function usageFromRow(raw: string | null): LocalReviewUsage | null {
  if (!raw) {
    return null;
  }
  try {
    const parsed = localReviewUsageSchema.safeParse(JSON.parse(raw));
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}
