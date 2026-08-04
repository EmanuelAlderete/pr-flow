"use client";

import { useState } from "react";
import { Plane } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Surface } from "@/components/ui/surface";
import { VacationSetupDialog } from "@/modules/vacation-countdown/components/vacation-setup-dialog";
import { useVacationCountdown } from "@/modules/vacation-countdown/hooks/use-vacation-countdown";
import {
  formatVacationDatePtBr,
  formatVacationDaysLabel
} from "@/modules/vacation-countdown/lib/vacation-countdown-labels";
import { ptBR } from "@/modules/messages/pt-BR";

export function DashboardVacationWidget() {
  const { startDate, daysRemaining, phase } = useVacationCountdown();
  const [editOpen, setEditOpen] = useState(false);

  if (startDate === null || daysRemaining === null || phase === null) {
    return (
      <Surface className="flex min-w-0 flex-col gap-2 p-3" data-testid="dashboard-vacation-widget">
        <div className="flex items-center gap-2.5">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-md border border-[var(--brand-border)] bg-[var(--brand-dim)] text-[var(--brand-bright)]">
            <Plane className="size-3.5" aria-hidden />
          </span>
          <div className="min-w-0 flex-1">
            <h2 className="text-sm font-semibold text-[var(--app-text)]">{ptBR.vacation.widgetTitle}</h2>
            <p className="text-xs text-[var(--app-text-muted)]">{ptBR.vacation.widgetEmpty}</p>
          </div>
          <Button type="button" size="sm" variant="outline" onClick={() => setEditOpen(true)}>
            {ptBR.vacation.configure}
          </Button>
        </div>
        <VacationSetupDialog open={editOpen} onOpenChange={setEditOpen} mode="setup" />
      </Surface>
    );
  }

  const label = formatVacationDaysLabel(daysRemaining, phase);
  const dateLabel = formatVacationDatePtBr(startDate);

  return (
    <Surface className="flex min-w-0 flex-col gap-2 p-3" data-testid="dashboard-vacation-widget">
      <div className="flex items-center gap-2.5">
        <span className="flex size-8 shrink-0 items-center justify-center rounded-md border border-[var(--brand-border)] bg-[var(--brand-dim)] text-[var(--brand-bright)]">
          <Plane className="size-3.5" aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="text-sm font-semibold text-[var(--app-text)]">{ptBR.vacation.widgetTitle}</h2>
          <p className="text-xs text-[var(--app-text-muted)]" aria-live="polite">
            {label}
            <span className="text-[var(--app-text-muted)]"> · {dateLabel}</span>
          </p>
        </div>
        {phase === "upcoming" ? (
          <div className="flex shrink-0 items-baseline gap-1">
            <span
              className="text-2xl font-semibold tabular-nums leading-none tracking-tight text-[var(--app-text)]"
              aria-hidden
            >
              {daysRemaining}
            </span>
            <span className="text-xs font-medium text-[var(--app-accent)]">{ptBR.vacation.sidebarUnit}</span>
          </div>
        ) : (
          <span className="shrink-0 text-sm font-medium text-[var(--app-accent)]">{label}</span>
        )}
        <Button type="button" size="sm" variant="ghost" onClick={() => setEditOpen(true)}>
          {ptBR.vacation.edit}
        </Button>
      </div>

      <VacationSetupDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        initialDate={startDate}
        mode="edit"
      />
    </Surface>
  );
}
