"use client";

import { CalendarDays, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Surface } from "@/components/ui/surface";
import { useDayCalendar } from "@/modules/day-calendar/hooks/use-day-calendar";
import { formatDayCalendarTimeRange } from "@/modules/day-calendar/lib/day-calendar-labels";
import { ptBR } from "@/modules/messages/pt-BR";

export function DashboardDayCalendarWidget() {
  const { data, isLoading, error, refresh } = useDayCalendar();

  const events = data?.status === "ok" ? data.events : [];
  const timeZone = data?.status === "ok" ? data.timeZone : "America/Sao_Paulo";
  const missingConfig = data?.status === "missing_config";

  return (
    <Surface className="flex h-full min-w-0 flex-col space-y-4 p-4" data-testid="dashboard-day-calendar-widget">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-[var(--brand-border)] bg-[var(--brand-dim)] text-[var(--brand-bright)]">
            <CalendarDays className="size-4" aria-hidden />
          </span>
          <div className="min-w-0 space-y-1">
            <h2 className="text-sm font-semibold text-[var(--app-text)]">
              {ptBR.dayCalendar.widgetTitle}
            </h2>
            <p className="text-xs text-[var(--app-text-muted)]">
              {isLoading
                ? ptBR.dayCalendar.loading
                : missingConfig
                  ? ptBR.dayCalendar.widgetEmptyConfig
                  : events.length === 0 && !error
                    ? ptBR.dayCalendar.widgetEmpty
                    : ptBR.dayCalendar.widgetHint(events.length)}
            </p>
          </div>
        </div>
        {isLoading ? (
          <Loader2 className="size-4 animate-spin text-muted-foreground" aria-hidden />
        ) : null}
      </div>

      {isLoading ? (
        <ul className="space-y-2" aria-label={ptBR.dayCalendar.loading}>
          {Array.from({ length: 3 }, (_, index) => (
            <li key={index} className="panel-inset space-y-2 px-3 py-2.5">
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-3 w-24" />
            </li>
          ))}
        </ul>
      ) : null}

      {!isLoading && error ? (
        <div className="flex flex-col items-start gap-3">
          <p className="text-sm text-destructive">{error}</p>
          <Button type="button" variant="outline" size="sm" onClick={() => void refresh()}>
            {ptBR.dayCalendar.retry}
          </Button>
        </div>
      ) : null}

      {!isLoading && !error && missingConfig ? (
        <p className="text-sm text-[var(--app-text-muted)]">{data.message}</p>
      ) : null}

      {!isLoading && !error && !missingConfig && events.length === 0 ? (
        <p className="text-sm text-[var(--app-text-muted)]">{ptBR.dayCalendar.noEvents}</p>
      ) : null}

      {!isLoading && !error && events.length > 0 ? (
        <ul className="min-h-0 space-y-2 overflow-y-auto" aria-label={ptBR.dayCalendar.listAriaLabel}>
          {events.map((event) => (
            <li key={event.uid} className="panel-inset px-3 py-2.5">
              <p className="text-sm font-medium leading-snug text-[var(--app-text)]">
                {event.title}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {formatDayCalendarTimeRange(
                  event.startsAt,
                  event.endsAt,
                  event.allDay,
                  timeZone
                )}
                {event.location ? (
                  <span className="text-[var(--app-text-muted)]"> · {event.location}</span>
                ) : null}
              </p>
            </li>
          ))}
        </ul>
      ) : null}
    </Surface>
  );
}
