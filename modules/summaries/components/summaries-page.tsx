"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import { ptBR as ptBRLocale } from "date-fns/locale";
import { Loader2 } from "lucide-react";
import ReactMarkdown from "react-markdown";
import rehypeSanitize from "rehype-sanitize";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Surface } from "@/components/ui/surface";
import { ptBR as messages } from "@/modules/messages";
import type { SummaryDto } from "@/modules/summaries/lib/domain";
import { notebookDayToDate, shiftNotebookDay } from "@/modules/journal/lib/notebook-day";
import type { SummaryType } from "@/modules/summaries/lib/schema";
import { WeeklyComparisonPanel } from "@/modules/summaries/components/weekly-comparison-panel";
import type { WeeklyComparisonResult } from "@/modules/summaries/lib/weekly-summary-comparison-service";

type FilterType = "all" | SummaryType;

function formatPeriodLabel(summary: SummaryDto): string {
  if (summary.type === "weekly") {
    const start = notebookDayToDate(summary.periodKey);
    const end = notebookDayToDate(shiftNotebookDay(summary.periodKey, 6));
    return `Semana ${format(start, "d MMM", { locale: ptBRLocale })} – ${format(end, "d MMM yyyy", { locale: ptBRLocale })}`;
  }

  return format(notebookDayToDate(summary.periodKey), "EEEE, d 'de' MMMM 'de' yyyy", {
    locale: ptBRLocale
  });
}

function typeLabel(type: SummaryType): string {
  return type === "daily" ? "Diário" : "Semanal";
}

export function SummariesPage() {
  const [summaries, setSummaries] = useState<SummaryDto[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterType>("all");
  const [isLoading, setIsLoading] = useState(true);
  const [weeklyComparison, setWeeklyComparison] = useState<WeeklyComparisonResult | null>(null);
  const [isComparisonLoading, setIsComparisonLoading] = useState(false);

  const loadSummaries = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({ limit: "100" });
      if (filter !== "all") {
        params.set("type", filter);
      }
      const response = await fetch(`/api/summaries?${params.toString()}`, { cache: "no-store" });
      if (!response.ok) {
        throw new Error(messages.summary.loadFailed);
      }
      const payload = (await response.json()) as { summaries: SummaryDto[] };
      setSummaries(payload.summaries);
      setSelectedId((current) => {
        if (current && payload.summaries.some((item) => item.id === current)) {
          return current;
        }
        return payload.summaries[0]?.id ?? null;
      });
    } catch {
      toast.error(messages.summary.loadHistoryFailed);
    } finally {
      setIsLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    void loadSummaries();
  }, [loadSummaries]);

  const selectedSummary = useMemo(
    () => summaries.find((summary) => summary.id === selectedId) ?? null,
    [summaries, selectedId]
  );

  useEffect(() => {
    if (!selectedSummary || selectedSummary.type !== "weekly") {
      setWeeklyComparison(null);
      return;
    }

    let cancelled = false;
    setIsComparisonLoading(true);

    void fetch(
      `/api/summaries/weekly-comparison?weekMonday=${encodeURIComponent(selectedSummary.periodKey)}`,
      { cache: "no-store" }
    )
      .then(async (response) => {
        if (!response.ok) {
          throw new Error("Falha ao carregar comparativo.");
        }
        return response.json() as Promise<WeeklyComparisonResult>;
      })
      .then((payload) => {
        if (!cancelled) {
          setWeeklyComparison(payload);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setWeeklyComparison(null);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsComparisonLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [selectedSummary]);

  return (
    <section className="flex min-h-0 flex-1 flex-col gap-4">
      <div className="flex flex-wrap gap-2">
        {(["all", "daily", "weekly"] as const).map((value) => (
          <Button
            key={value}
            type="button"
            size="sm"
            variant={filter === value ? "default" : "outline"}
            onClick={() => setFilter(value)}
          >
            {value === "all" ? "Todos" : value === "daily" ? "Diários" : "Semanais"}
          </Button>
        ))}
      </div>

      <div className="grid min-h-0 flex-1 gap-4 lg:grid-cols-[minmax(220px,280px)_1fr]">
        <Surface
          as="aside"
          className="flex max-h-[min(70vh,640px)] flex-col gap-2 overflow-y-auto p-2"
        >
          {isLoading ? (
            <>
              <Skeleton className="h-14 w-full" />
              <Skeleton className="h-14 w-full" />
              <Skeleton className="h-14 w-full" />
            </>
          ) : summaries.length === 0 ? (
            <p className="p-3 text-sm text-muted-foreground">
              Nenhum resumo gerado ainda. Os resumos diários são criados à meia-noite para o dia
              anterior; os semanais, às segundas.
            </p>
          ) : (
            summaries.map((summary) => (
              <button
                key={summary.id}
                type="button"
                onClick={() => setSelectedId(summary.id)}
                className={`rounded-md border px-3 py-2 text-left text-sm transition-colors ${
                  selectedId === summary.id
                    ? "border-[var(--brand-border)] bg-[var(--brand-dim)] text-[var(--brand-bright)]"
                    : "border-transparent hover:bg-muted/60"
                }`}
              >
                <span className="block font-medium">{formatPeriodLabel(summary)}</span>
                <span className="text-xs text-muted-foreground">{typeLabel(summary.type)}</span>
              </button>
            ))
          )}
        </Surface>

        <Surface as="article" className="min-h-[min(50vh,480px)] p-4 md:p-6">
          {isLoading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" aria-hidden />
              Carregando resumo...
            </div>
          ) : !selectedSummary ? (
            <p className="text-sm text-muted-foreground">Selecione um resumo na lista.</p>
          ) : (
            <div className="space-y-4">
              <header className="space-y-1 border-b border-border pb-4">
                <h3 className="text-base font-medium">{formatPeriodLabel(selectedSummary)}</h3>
                <p className="text-xs text-muted-foreground">
                  {typeLabel(selectedSummary.type)} · Gerado em{" "}
                  {format(new Date(selectedSummary.generatedAt), "d MMM yyyy, HH:mm", {
                    locale: ptBRLocale
                  })}
                </p>
              </header>
              {selectedSummary.type === "weekly" && !isComparisonLoading && weeklyComparison ? (
                <WeeklyComparisonPanel comparison={weeklyComparison} />
              ) : null}
              {selectedSummary.type === "weekly" && isComparisonLoading ? (
                <Skeleton className="h-32 w-full" aria-label="Carregando comparativo semanal" />
              ) : null}
              <div className="prose prose-sm dark:prose-invert max-w-none text-foreground prose-headings:text-foreground prose-p:text-foreground/90 prose-strong:text-foreground prose-code:text-foreground prose-a:text-[var(--app-link)] prose-a:underline-offset-2 hover:prose-a:text-[var(--brand-bright)] prose-blockquote:border-border prose-blockquote:text-muted-foreground prose-hr:border-border">
                <ReactMarkdown rehypePlugins={[rehypeSanitize]}>
                  {selectedSummary.content}
                </ReactMarkdown>
              </div>
            </div>
          )}
        </Surface>
      </div>
    </section>
  );
}
