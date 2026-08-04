import { writeSystemLogFireAndForget } from "@/modules/observability/lib/system-logger";
import type { PrApiResponse } from "@/modules/prs/lib/domain";
import {
  getPrSyncMeta,
  loadPrMonitorCache,
  loadPrReviewContextCache,
  savePrCaches,
  savePrSyncMeta
} from "@/modules/prs/lib/pr-cache-repository";
import { syncOpenPrBranchBaseRedirects } from "@/modules/prs/lib/open-pr/open-pr-branch-base-sync";
import { detectPrTimelineEvents } from "@/modules/prs/lib/pr-timeline-detect";
import { insertPrTimelineEvents } from "@/modules/prs/lib/pr-timeline-repository";
import { getMonitoredRepositorySlugsForSync } from "@/modules/prs/lib/monitored-repositories-service";
import { getPrSyncData, toMonitorApiResponse } from "@/modules/prs/lib/pr-sync-data-service";

const PRS_SYNC_LOG_SOURCE = "prs:sync";

export type PrSyncResult = {
  status: "ok" | "skipped" | "error" | "unauthenticated";
  prCount: number;
  response?: PrApiResponse;
  error?: string;
};

export async function syncPrCache(): Promise<PrSyncResult> {
  const repos = await getMonitoredRepositorySlugsForSync();
  if (repos.length === 0) {
    return { status: "skipped", prCount: 0, error: "Nenhum repositório cadastrado." };
  }

  try {
    await syncOpenPrBranchBaseRedirects();
  } catch (error) {
    writeSystemLogFireAndForget({
      level: "warn",
      source: PRS_SYNC_LOG_SOURCE,
      message: "Falha ao redirecionar branches destino do wizard abrir PR.",
      details: {
        error: error instanceof Error ? error.message : String(error)
      }
    });
  }

  const result = await getPrSyncData();

  if (result.status === "ok") {
    const syncedAt = new Date(result.fetchedAt);
    const [previousMonitor, previousReviewContext] = await Promise.all([
      loadPrMonitorCache(),
      loadPrReviewContextCache()
    ]);

    const timelineEvents = detectPrTimelineEvents({
      previousMonitor: previousMonitor?.data ?? null,
      nextMonitor: result.monitor,
      previousReviewContext: previousReviewContext?.data ?? null,
      nextReviewContext: result.reviewContext,
      githubLogin: result.githubLogin,
      syncedAt
    });
    await insertPrTimelineEvents(timelineEvents);

    await savePrCaches({
      monitor: result.monitor,
      reviewerQueue: result.reviewerQueue,
      reviewContext: result.reviewContext,
      githubLogin: result.githubLogin
    });
    const response = toMonitorApiResponse(result);
    return { status: "ok", prCount: result.monitor.length, response };
  }

  const previousMeta = await getPrSyncMeta();

  if (result.status === "unauthenticated") {
    await savePrSyncMeta({
      githubLogin: previousMeta?.githubLogin ?? null,
      status: "unauthenticated",
      error: result.message
    });
    return {
      status: "unauthenticated",
      prCount: 0,
      response: { status: "unauthenticated", message: result.message },
      error: result.message
    };
  }

  await savePrSyncMeta({
    githubLogin: previousMeta?.githubLogin ?? null,
    status: "error",
    error: result.message
  });

  writeSystemLogFireAndForget({
    level: "error",
    source: PRS_SYNC_LOG_SOURCE,
    message: result.message,
    details: result
  });

  return {
    status: "error",
    prCount: 0,
    response: { status: "error", message: result.message },
    error: result.message
  };
}

