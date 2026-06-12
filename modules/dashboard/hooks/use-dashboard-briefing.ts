"use client";

import { useCallback, useEffect, useState } from "react";
import type { DashboardBriefingResponse } from "@/modules/dashboard/lib/dashboard-briefing-types";
import {
  loadDashboardBriefingCache,
  saveDashboardBriefingCache
} from "@/modules/dashboard/lib/dashboard-widget-cache";
import { todayLocalDateString } from "@/modules/journal/lib/notebook-day";

export type DashboardBriefingLoadState =
  | "loading"
  | "ready"
  | "waiting"
  | "missing_api_key"
  | "rate_limited"
  | "no_input"
  | "error";

type BriefingSetters = {
  setSummary: (value: string | null) => void;
  setGeneratedAt: (value: string | null) => void;
  setPreviousBusinessDay: (value: string | null) => void;
  setErrorMessage: (value: string | null) => void;
  setLoadState: (value: DashboardBriefingLoadState) => void;
};

function applyBriefingResponse(body: DashboardBriefingResponse, setters: BriefingSetters): void {
  const {
    setSummary,
    setGeneratedAt,
    setPreviousBusinessDay,
    setErrorMessage,
    setLoadState
  } = setters;

  if (body.status === "ok") {
    setSummary(body.summary);
    setGeneratedAt(body.generatedAt);
    setPreviousBusinessDay(body.previousBusinessDay);
    setErrorMessage(null);
    setLoadState("ready");
    return;
  }

  if (body.status === "not_generated") {
    setSummary(null);
    setGeneratedAt(null);
    setPreviousBusinessDay(body.previousBusinessDay);
    setErrorMessage(null);
    setLoadState("waiting");
    return;
  }

  setSummary(null);
  setGeneratedAt(null);
  setPreviousBusinessDay(null);

  if (body.status === "missing_api_key") {
    setErrorMessage(body.message);
    setLoadState("missing_api_key");
    return;
  }

  if (body.status === "rate_limited") {
    setErrorMessage(body.message);
    setLoadState("rate_limited");
    return;
  }

  if (body.status === "no_input") {
    setErrorMessage(body.message);
    setLoadState("no_input");
    return;
  }

  setErrorMessage(body.message);
  setLoadState("error");
}

export function useDashboardBriefing(dayInput?: string) {
  const [day] = useState(() => dayInput ?? todayLocalDateString());
  const [loadState, setLoadState] = useState<DashboardBriefingLoadState>("loading");
  const [summary, setSummary] = useState<string | null>(null);
  const [generatedAt, setGeneratedAt] = useState<string | null>(null);
  const [previousBusinessDay, setPreviousBusinessDay] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const responseSetters: BriefingSetters = {
    setSummary,
    setGeneratedAt,
    setPreviousBusinessDay,
    setErrorMessage,
    setLoadState
  };

  const fetchBriefing = useCallback(async () => {
    const hasCached = loadDashboardBriefingCache(day) !== null;
    if (!hasCached) {
      setLoadState("loading");
    }
    setErrorMessage(null);

    try {
      const response = await fetch(`/api/dashboard/briefing?day=${encodeURIComponent(day)}`, {
        cache: "no-store"
      });
      const body = (await response.json()) as DashboardBriefingResponse;
      applyBriefingResponse(body, responseSetters);
      saveDashboardBriefingCache(day, body);
    } catch {
      setSummary(null);
      setGeneratedAt(null);
      setErrorMessage("Não foi possível carregar o briefing do dash.");
      setLoadState("error");
    }
  }, [day]);

  useEffect(() => {
    const cached = loadDashboardBriefingCache(day);
    if (cached) {
      applyBriefingResponse(cached, responseSetters);
    }
    void fetchBriefing();
  }, [day, fetchBriefing]);

  const isLoading = loadState === "loading";
  const hasSummary = loadState === "ready" && summary !== null;

  return {
    day,
    loadState,
    summary,
    generatedAt,
    previousBusinessDay,
    errorMessage,
    fetchBriefing,
    isLoading,
    hasSummary
  };
}
