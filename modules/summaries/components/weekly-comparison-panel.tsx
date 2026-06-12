"use client";

import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { TrendingDown, TrendingUp } from "lucide-react";
import { Surface } from "@/components/ui/surface";
import { notebookDayToDate } from "@/modules/journal/lib/notebook-day";
import type { WeeklyComparisonDelta } from "@/modules/summaries/lib/weekly-summary-aggregates";
import type { WeeklyComparisonResult } from "@/modules/summaries/lib/weekly-summary-comparison-service";

type WeeklyComparisonPanelProps = {
  comparison: WeeklyComparisonResult;
};

function formatDelta(delta: number): string {
  if (delta > 0) {
    return `+${delta}`;
  }
  return String(delta);
}

export function WeeklyComparisonPanel({ comparison }: WeeklyComparisonPanelProps) {
  const maxScore = Math.max(1, ...comparison.activityByDay.map((day) => day.score));

  return (
    <Surface variant="inset" className="space-y-4 p-4">
      <div className="space-y-1">
        <h4 className="text-sm font-medium">Comparativo semanal</h4>
        <p className="text-xs text-muted-foreground">
          {comparison.hasPreviousWeekSummary
            ? "Resumo da semana anterior disponível para referência na geração."
            : "Sem resumo persistido da semana anterior."}
        </p>
      </div>

      {comparison.deltas.length > 0 ? (
        <dl className="grid gap-2 sm:grid-cols-2">
          {comparison.deltas.map((item: WeeklyComparisonDelta) => (
            <div
              key={item.metric}
              className="flex items-center justify-between rounded-md border border-border px-3 py-2 text-sm"
            >
              <dt className="text-muted-foreground">{item.metric}</dt>
              <dd className="flex items-center gap-2 font-medium tabular-nums">
                <span>
                  {item.current}
                  <span className="text-muted-foreground"> vs {item.previous}</span>
                </span>
                <span
                  className={
                    item.delta > 0
                      ? "text-[var(--app-accent)]"
                      : item.delta < 0
                        ? "text-muted-foreground"
                        : "text-muted-foreground"
                  }
                  aria-label={`Variação: ${formatDelta(item.delta)}`}
                >
                  {item.delta > 0 ? (
                    <TrendingUp className="size-3.5" aria-hidden />
                  ) : item.delta < 0 ? (
                    <TrendingDown className="size-3.5" aria-hidden />
                  ) : null}
                  {formatDelta(item.delta)}
                </span>
              </dd>
            </div>
          ))}
        </dl>
      ) : (
        <p className="text-sm text-muted-foreground">
          Métricas da semana anterior indisponíveis para comparação numérica.
        </p>
      )}

      {comparison.carryOverTaskCount > 0 ? (
        <p className="text-sm text-muted-foreground">
          {comparison.carryOverTaskCount} tarefa(s) pendente(s) no fim da semana (carry-over).
        </p>
      ) : null}

      <div className="space-y-2">
        <p className="text-xs font-medium text-muted-foreground">Atividade por dia</p>
        <div
          className="flex h-20 items-end gap-1.5"
          role="img"
          aria-label="Gráfico de atividade por dia da semana"
        >
          {comparison.activityByDay.map((day) => {
            const heightRem = (day.score / maxScore) * 3;
            const label = format(notebookDayToDate(day.day), "EEE", { locale: ptBR });
            return (
              <div key={day.day} className="flex flex-1 flex-col items-center gap-1">
                <div
                  className="w-full rounded-sm bg-[var(--brand-dim)]"
                  style={{ height: `${Math.max(heightRem, day.score > 0 ? 0.5 : 0.125)}rem` }}
                  title={`${day.day}: ${day.score} ponto(s)`}
                />
                <span className="text-[10px] uppercase text-muted-foreground">{label}</span>
              </div>
            );
          })}
        </div>
      </div>
    </Surface>
  );
}
