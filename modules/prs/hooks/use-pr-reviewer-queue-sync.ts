"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { ReviewerQueueApiResponse, ReviewerQueueApiStale } from "@/modules/prs/lib/domain";
import { PR_MONITOR_SYNC_UPDATED_EVENT } from "@/modules/prs/lib/pr-monitor-cache";
import {
  loadPrReviewerQueueLastSync,
  savePrReviewerQueueLastSync
} from "@/modules/prs/lib/pr-reviewer-queue-cache";

function persistSuccessfulSync(response: ReviewerQueueApiResponse) {
  if (response.status === "ok") {
    savePrReviewerQueueLastSync(response);
  }
}

function staleFromLocalCache(message: string): ReviewerQueueApiStale | null {
  const cached = loadPrReviewerQueueLastSync();
  if (!cached) {
    return null;
  }

  return {
    status: "stale",
    data: cached.data,
    fetchedAt: cached.fetchedAt,
    githubLogin: cached.githubLogin,
    message
  };
}

async function fetchReviewerQueueFromApi(): Promise<{ ok: boolean; body: ReviewerQueueApiResponse }> {
  const result = await fetch("/api/prs/reviewer-queue", { method: "GET", cache: "no-store" });
  const body = (await result.json()) as ReviewerQueueApiResponse;
  return { ok: result.ok, body };
}

async function syncPrCacheFromApi(): Promise<void> {
  await fetch("/api/prs", { method: "POST", cache: "no-store" });
}

function resolveQueueResponse(
  ok: boolean,
  body: ReviewerQueueApiResponse,
  fallbackMessage: string
): ReviewerQueueApiResponse {
  if (body.status === "stale") {
    return body;
  }

  if (!ok && body.status === "error") {
    return staleFromLocalCache(body.message) ?? body;
  }

  if (!ok) {
    return (
      staleFromLocalCache(fallbackMessage) ?? {
        status: "error",
        message: fallbackMessage
      }
    );
  }

  persistSuccessfulSync(body);
  return body;
}

export function usePrReviewerQueueSync() {
  const [response, setResponse] = useState<ReviewerQueueApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [isFetching, setIsFetching] = useState(false);
  const inFlightRef = useRef(false);

  const runLoad = useCallback(async (options?: { syncFirst?: boolean }) => {
    if (inFlightRef.current) {
      return null;
    }

    inFlightRef.current = true;
    setIsFetching(true);
    const hasCachedOk = loadPrReviewerQueueLastSync() !== null;
    if (!hasCachedOk) {
      setLoading(true);
    }

    const fallbackMessage = options?.syncFirst
      ? "Falha ao sincronizar fila de revisão."
      : "Falha ao carregar fila de revisão.";

    try {
      if (options?.syncFirst) {
        try {
          await syncPrCacheFromApi();
        } catch {
          // Still attempt to read the last known queue after a network failure on sync.
        }
      }

      const { ok, body } = await fetchReviewerQueueFromApi();
      const next = resolveQueueResponse(ok, body, fallbackMessage);
      setResponse(next);
      return next;
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Erro de rede ao consultar fila de revisão.";
      const next =
        staleFromLocalCache(message) ?? ({ status: "error", message } satisfies ReviewerQueueApiResponse);
      setResponse(next);
      return next;
    } finally {
      setLoading(false);
      setIsFetching(false);
      inFlightRef.current = false;
    }
  }, []);

  const load = useCallback(() => runLoad(), [runLoad]);
  const refresh = useCallback(() => runLoad({ syncFirst: true }), [runLoad]);

  useEffect(() => {
    const cached = loadPrReviewerQueueLastSync();
    if (cached) {
      setResponse(cached);
      setLoading(false);
    }

    void load();
  }, [load]);

  useEffect(() => {
    const onSyncUpdated = () => {
      void load();
    };

    window.addEventListener(PR_MONITOR_SYNC_UPDATED_EVENT, onSyncUpdated);
    return () => window.removeEventListener(PR_MONITOR_SYNC_UPDATED_EVENT, onSyncUpdated);
  }, [load]);

  return {
    response,
    loading,
    isFetching,
    refresh,
    load
  };
}
