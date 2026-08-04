"use client";

import { Plane } from "lucide-react";
import { cn } from "@/lib/utils";
import { useVacationCountdown } from "@/modules/vacation-countdown/hooks/use-vacation-countdown";
import {
  formatVacationDatePtBr,
  formatVacationDaysLabel,
  formatVacationSidebarHeadline
} from "@/modules/vacation-countdown/lib/vacation-countdown-labels";
import { ptBR } from "@/modules/messages/pt-BR";

type VacationCountdownSidebarProps = {
  className?: string;
  /** When true, only the compact icon-mode face is rendered. */
  iconOnly?: boolean;
};

export function VacationCountdownSidebar({ className, iconOnly = false }: VacationCountdownSidebarProps) {
  const { startDate, daysRemaining, phase } = useVacationCountdown();

  if (startDate === null || daysRemaining === null || phase === null) {
    return null;
  }

  const headline = formatVacationSidebarHeadline(daysRemaining, phase);
  const label = formatVacationDaysLabel(daysRemaining, phase);
  const dateLabel = formatVacationDatePtBr(startDate);

  if (iconOnly) {
    return (
      <aside
        className={cn(
          "weather-forecast weather-forecast--sidebar-icon hidden group-data-[collapsible=icon]:flex",
          className
        )}
        aria-label={label}
        title={`${label} · ${dateLabel}`}
      >
        {phase === "upcoming" ? (
          <span className="weather-forecast__rotator-temp text-[0.65rem]">{headline}</span>
        ) : (
          <Plane className="weather-forecast__rotator-icon" aria-hidden />
        )}
      </aside>
    );
  }

  return (
    <aside
      className={cn(
        "weather-forecast weather-forecast--sidebar group-data-[collapsible=icon]:hidden",
        className
      )}
      aria-label={label}
    >
      <p className="weather-forecast__city small muted">{ptBR.vacation.sidebarEyebrow}</p>
      <div className="weather-forecast__main">
        <p className="weather-forecast__temp">
          {phase === "upcoming" ? (
            <>
              {headline}
              <span className="ml-1 text-sm font-medium text-[var(--app-text-muted)]">
                {ptBR.vacation.sidebarUnit}
              </span>
            </>
          ) : (
            headline
          )}
        </p>
        <Plane className="weather-forecast__expanded-icon" aria-hidden />
      </div>
      <p className="weather-forecast__condition small">{label}</p>
      <p className="weather-forecast__range small muted">{dateLabel}</p>
    </aside>
  );
}
