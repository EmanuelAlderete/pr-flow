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

async function fetchPrMonitorFromApi(): Promise<{ ok: boolean; body: PrApiResponse }> {
  const result = await fetch("/api/prs", { method: "GET", cache: "no-store" });
  const body = (await result.json()) as PrApiResponse;
  return { ok: result.ok, body };
}

export function usePrMonitorSync() {
  const [response, setResponse] = useState<PrApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [isFetching, setIsFetching] = useState(false);
  const inFlightRef = useRef(false);

  const load = useCallback(async () => {
    if (inFlightRef.current) {
      return null;
    }

    inFlightRef.current = true;
    setIsFetching(true);
    const hasCachedOk = loadPrMonitorLastSync() !== null;
    if (!hasCachedOk) {
      setLoading(true);
    }

    try {
      const { ok, body } = await fetchPrMonitorFromApi();

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
        const stale = staleFromLocalCache("Falha ao carregar monitor.");
        if (stale) {
          setResponse(stale);
          return stale;
        }
        const errorBody: PrApiResponse = {
          status: "error",
          message: "Falha ao carregar monitor."
        };
        setResponse(errorBody);
        return errorBody;
      }

      persistSuccessfulSync(body);
      setResponse(body);
      return body;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erro de rede ao consultar monitor.";
      const stale = staleFromLocalCache(message);
      if (stale) {
        setResponse(stale);
        return stale;
      }
      const body: PrApiResponse = { status: "error", message };
      setResponse(body);
      return body;
    } finally {
      setLoading(false);
      setIsFetching(false);
      inFlightRef.current = false;
    }
  }, []);

  useEffect(() => {
    const cached = loadPrMonitorLastSync();
    if (cached) {
      setResponse(cached);
      setLoading(false);
    }

    void load();
  }, [load]);

  return {
    response,
    loading,
    isFetching,
    refresh: load
  };
}
