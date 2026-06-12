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

export function usePrReviewerQueueSync() {
  const [response, setResponse] = useState<ReviewerQueueApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [isFetching, setIsFetching] = useState(false);
  const inFlightRef = useRef(false);

  const load = useCallback(async () => {
    if (inFlightRef.current) {
      return null;
    }

    inFlightRef.current = true;
    setIsFetching(true);
    const hasCachedOk = loadPrReviewerQueueLastSync() !== null;
    if (!hasCachedOk) {
      setLoading(true);
    }

    try {
      const { ok, body } = await fetchReviewerQueueFromApi();

      if (body.status === "stale") {
        setResponse(body);
        return body;
      }

      if (!ok && body.status === "error") {
        const stale = staleFromLocalCache(body.message);
        if (stale) {
          setResponse(stale);
          return stale;
        }
        setResponse(body);
        return body;
      }

      if (!ok) {
        const stale = staleFromLocalCache("Falha ao carregar fila de revisão.");
        if (stale) {
          setResponse(stale);
          return stale;
        }
        const errorBody: ReviewerQueueApiResponse = {
          status: "error",
          message: "Falha ao carregar fila de revisão."
        };
        setResponse(errorBody);
        return errorBody;
      }

      persistSuccessfulSync(body);
      setResponse(body);
      return body;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erro de rede ao consultar fila de revisão.";
      const stale = staleFromLocalCache(message);
      if (stale) {
        setResponse(stale);
        return stale;
      }
      const body: ReviewerQueueApiResponse = { status: "error", message };
      setResponse(body);
      return body;
    } finally {
      setLoading(false);
      setIsFetching(false);
      inFlightRef.current = false;
    }
  }, []);

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
    refresh: load
  };
}
