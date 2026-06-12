import { PrCacheNotReadyError } from "@/modules/prs/lib/pr-cache-errors";
import {
  getPrSyncMeta,
  loadPrMonitorCache,
  loadPrMonitorCacheAllowStale,
  loadPrReviewerQueueCache,
  loadPrReviewerQueueCacheAllowStale
} from "@/modules/prs/lib/pr-cache-repository";
import type { PrApiResponse, ReviewerQueueApiResponse } from "@/modules/prs/lib/domain";
import { enrichPrApiResponse } from "@/modules/prs/lib/pr-slack-share-enrichment";

function syncFailureMessage(
  status: "error" | "unauthenticated" | undefined,
  fallback: string,
  metaError: string | null | undefined
): string {
  if (metaError?.trim()) {
    return metaError.trim();
  }

  if (status === "unauthenticated") {
    return "GitHub CLI sem autenticacao. Defina GH_TOKEN no .env ou execute `gh auth login`.";
  }

  return fallback;
}

export async function getMonitorFromCache(): Promise<PrApiResponse> {
  const meta = await getPrSyncMeta();

  if (meta?.lastSyncStatus === "ok") {
    const cached = await loadPrMonitorCache();
    if (!cached) {
      throw new PrCacheNotReadyError();
    }

    return enrichPrApiResponse({
      status: "ok",
      data: cached.data,
      fetchedAt: cached.fetchedAt,
      githubLogin: cached.githubLogin
    });
  }

  const stale = await loadPrMonitorCacheAllowStale();
  if (stale) {
    return enrichPrApiResponse({
      status: "stale",
      data: stale.data,
      fetchedAt: stale.fetchedAt,
      githubLogin: stale.githubLogin,
      message: syncFailureMessage(
        meta?.lastSyncStatus === "unauthenticated" ? "unauthenticated" : "error",
        "Falha na ultima sincronizacao com o GitHub.",
        meta?.lastSyncError
      )
    });
  }

  if (meta?.lastSyncStatus === "unauthenticated") {
    return {
      status: "unauthenticated",
      message: syncFailureMessage("unauthenticated", "", meta?.lastSyncError)
    };
  }

  if (meta?.lastSyncStatus === "error") {
    return {
      status: "error",
      message: syncFailureMessage("error", "Falha na ultima sincronizacao com o GitHub.", meta?.lastSyncError)
    };
  }

  throw new PrCacheNotReadyError();
}

export async function getReviewerQueueFromCache(): Promise<ReviewerQueueApiResponse> {
  const meta = await getPrSyncMeta();

  if (meta?.lastSyncStatus === "ok") {
    const cached = await loadPrReviewerQueueCache();
    if (!cached) {
      throw new PrCacheNotReadyError();
    }

    return {
      status: "ok",
      data: cached.data,
      fetchedAt: cached.fetchedAt,
      githubLogin: cached.githubLogin
    };
  }

  const stale = await loadPrReviewerQueueCacheAllowStale();
  if (stale) {
    return {
      status: "stale",
      data: stale.data,
      fetchedAt: stale.fetchedAt,
      githubLogin: stale.githubLogin,
      message: syncFailureMessage(
        meta?.lastSyncStatus === "unauthenticated" ? "unauthenticated" : "error",
        "Falha na ultima sincronizacao com o GitHub.",
        meta?.lastSyncError
      )
    };
  }

  if (meta?.lastSyncStatus === "unauthenticated") {
    return {
      status: "unauthenticated",
      message: syncFailureMessage("unauthenticated", "", meta?.lastSyncError)
    };
  }

  if (meta?.lastSyncStatus === "error") {
    return {
      status: "error",
      message: syncFailureMessage("error", "Falha na ultima sincronizacao com o GitHub.", meta?.lastSyncError)
    };
  }

  throw new PrCacheNotReadyError();
}
