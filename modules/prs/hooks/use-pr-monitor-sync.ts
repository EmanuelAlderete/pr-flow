"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { PrApiResponse, PrApiStale } from "@/modules/prs/lib/domain";
import { loadPrMonitorLastSync, savePrMonitorLastSync } from "@/modules/prs/lib/pr-monitor-cache";

function persistSuccessfulSync(response: PrApiResponse) {
  if (response.status === "ok") {
    savePrMonitorLastSync(response);
  }
}

function staleFromLocalCache(message: string): PrApiStale | null {
  const cached = loadPrMonitorLastSync();
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

async function fetchPrMonitorFromApi(
  method: "GET" | "POST"
): Promise<{ ok: boolean; body: PrApiResponse }> {
  const result = await fetch("/api/prs", { method, cache: "no-store" });
  const body = (await result.json()) as PrApiResponse;
  return { ok: result.ok, body };
}

function resolveMonitorResponse(
  ok: boolean,
  body: PrApiResponse,
  fallbackMessage: string
): PrApiResponse {
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

export function usePrMonitorSync() {
  const [response, setResponse] = useState<PrApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [isFetching, setIsFetching] = useState(false);
  const inFlightRef = useRef(false);

  const runFetch = useCallback(async (method: "GET" | "POST", options?: { silent?: boolean }) => {
    if (inFlightRef.current) {
      return null;
    }

    inFlightRef.current = true;
    if (!options?.silent) {
      setIsFetching(true);
    }
    const hasCachedOk = loadPrMonitorLastSync() !== null;
    if (!hasCachedOk && !options?.silent) {
      setLoading(true);
    }

    const fallbackMessage =
      method === "POST" ? "Falha ao sincronizar monitor." : "Falha ao carregar monitor.";

    try {
      const { ok, body } = await fetchPrMonitorFromApi(method);
      if (options?.silent && !ok) {
        return null;
      }
      const next = resolveMonitorResponse(ok, body, fallbackMessage);
      setResponse(next);
      return next;
    } catch (error) {
      if (options?.silent) {
        return null;
      }
      const message = error instanceof Error ? error.message : "Erro de rede ao consultar monitor.";
      const next = staleFromLocalCache(message) ?? ({ status: "error", message } satisfies PrApiResponse);
      setResponse(next);
      return next;
    } finally {
      if (!options?.silent) {
        setLoading(false);
        setIsFetching(false);
      }
      inFlightRef.current = false;
    }
  }, []);

  const load = useCallback(() => runFetch("GET"), [runFetch]);
  const refresh = useCallback(() => runFetch("POST"), [runFetch]);
  const reload = useCallback(() => runFetch("GET", { silent: true }), [runFetch]);

  useEffect(() => {
    const cached = loadPrMonitorLastSync();
    if (cached) {
      setResponse(cached);
      setLoading(false);
    }

    void load();
  }, [load]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      if (document.visibilityState === "hidden") {
        return;
      }
      void reload();
    }, 5000);
    return () => window.clearInterval(timer);
  }, [reload]);

  return {
    response,
    loading,
    isFetching,
    refresh,
    load,
    reload
  };
}
