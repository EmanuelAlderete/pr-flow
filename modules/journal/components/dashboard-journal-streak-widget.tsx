"use client";

import Link from "next/link";
import { BookOpen, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Surface } from "@/components/ui/surface";
import { cn } from "@/lib/utils";
import { useJournalStreak } from "@/modules/journal/hooks/use-journal-streak";
import type { JournalStreakDayStatus } from "@/modules/journal/lib/journal-streak";
import { ptBR } from "@/modules/messages/pt-BR";

function dayStatusLabel(day: string, status: JournalStreakDayStatus): string {
  if (status === "filled") {
    return ptBR.journalStreak.dayFilled(day);
  }
  if (status === "pending") {
    return ptBR.journalStreak.dayPending(day);
  }
  return ptBR.journalStreak.dayEmpty(day);
}

export function DashboardJournalStreakWidget() {
  const { data, isLoading, error, refresh } = useJournalStreak();

  const streak = data?.currentStreak ?? 0;
  const todayPending = data?.todayPending ?? false;
  const ctaHref = data ? `/journal?day=${encodeURIComponent(data.today)}` : "/journal";

  return (
    <Surface className="flex min-w-0 flex-col gap-2 p-3" data-testid="dashboard-journal-streak-widget">
      <div className="flex items-center gap-2.5">
        <span className="flex size-8 shrink-0 items-center justify-center rounded-md border border-[var(--brand-border)] bg-[var(--brand-dim)] text-[var(--brand-bright)]">
          <BookOpen className="size-3.5" aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold text-[var(--app-text)]">
              {ptBR.journalStreak.widgetTitle}
            </h2>
            {isLoading ? (
              <Loader2 className="size-3.5 shrink-0 animate-spin text-muted-foreground" aria-hidden />
            ) : null}
          </div>
          <p className="text-xs text-[var(--app-text-muted)]" aria-live="polite">
            {isLoading
              ? ptBR.journalStreak.loading
              : error
                ? error
                : streak === 0
                  ? ptBR.journalStreak.widgetEmpty
                  : ptBR.journalStreak.streakLabel(streak)}
          </p>
        </div>
        {!isLoading && !error && data ? (
          <span
            className="shrink-0 text-2xl font-semibold tabular-nums leading-none tracking-tight text-[var(--brand-bright)]"
            data-testid="journal-streak-count"
          >
            {streak}
          </span>
        ) : null}
        {!isLoading && error ? (
          <Button type="button" variant="outline" size="sm" onClick={() => void refresh()}>
            {ptBR.journalStreak.retry}
          </Button>
        ) : null}
      </div>

      {!isLoading && !error && data?.strip ? (
        <>
          <ol
            className="flex items-end gap-1"
            aria-label={ptBR.journalStreak.stripAriaLabel}
            data-testid="journal-streak-strip"
          >
            {data.strip.map((day) => (
              <li key={day.notebookDay} className="min-w-0 flex-1">
                <span
                  title={dayStatusLabel(day.notebookDay, day.status)}
                  aria-label={dayStatusLabel(day.notebookDay, day.status)}
                  data-status={day.status}
                  data-notebook-day={day.notebookDay}
                  className={cn(
                    "block h-2 w-full rounded-sm",
                    day.status === "filled" && "bg-[var(--brand-bright)]",
                    day.status === "pending" &&
                      "border border-dashed border-[var(--brand-bright)] bg-[var(--brand-dim)]",
                    day.status === "empty" && "bg-[var(--app-surface-inset)]"
                  )}
                />
              </li>
            ))}
          </ol>

          <Button size="sm" variant="outline" className="self-start" render={<Link href={ctaHref} />}>
            {todayPending ? ptBR.journalStreak.openToday : ptBR.journalStreak.openJournal}
          </Button>
        </>
      ) : null}
    </Surface>
  );
}
