"use client";

import { useCallback, useEffect, useState } from "react";
import type { DayCalendarResponse } from "@/modules/day-calendar/lib/day-calendar-validation";
import { dayCalendarResponseSchema } from "@/modules/day-calendar/lib/day-calendar-validation";

export function useDayCalendar() {
  const [data, setData] = useState<DayCalendarResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/dashboard/calendar-today", {
        cache: "no-store"
      });
      const body: unknown = await response.json();
      const parsed = dayCalendarResponseSchema.safeParse(body);

      if (!parsed.success) {
        throw new Error("invalid response");
      }

      setData(parsed.data);
      if (parsed.data.status === "error") {
        setError(parsed.data.message);
      }
    } catch {
      setData(null);
      setError("Não foi possível carregar os eventos do dia.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { data, isLoading, error, refresh };
}
