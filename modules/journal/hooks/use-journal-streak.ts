"use client";

import { useCallback, useEffect, useState } from "react";
import type { JournalStreakSnapshot } from "@/modules/journal/lib/journal-streak";
import { ptBR } from "@/modules/messages/pt-BR";

export function useJournalStreak() {
  const [data, setData] = useState<JournalStreakSnapshot | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/journal/streak");
      if (!response.ok) {
        throw new Error(ptBR.journalStreak.loadFailed);
      }
      const payload = (await response.json()) as JournalStreakSnapshot;
      setData(payload);
    } catch {
      setData(null);
      setError(ptBR.journalStreak.loadFailed);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { data, isLoading, error, refresh };
}
