import { ptBR } from "@/modules/messages/pt-BR";
import type { VacationCountdownPhase } from "@/modules/vacation-countdown/lib/vacation-days-until";

export function formatVacationDaysLabel(daysRemaining: number, phase: VacationCountdownPhase): string {
  if (phase === "today") {
    return ptBR.vacation.today;
  }
  if (phase === "ongoing") {
    return ptBR.vacation.ongoing;
  }
  return ptBR.vacation.daysRemaining(daysRemaining);
}

export function formatVacationSidebarHeadline(
  daysRemaining: number,
  phase: VacationCountdownPhase
): string {
  if (phase === "today") {
    return ptBR.vacation.sidebarToday;
  }
  if (phase === "ongoing") {
    return ptBR.vacation.sidebarOngoing;
  }
  return String(daysRemaining);
}

export function formatVacationDatePtBr(startDate: string): string {
  const [year, month, day] = startDate.split("-").map(Number);
  return new Date(year, month - 1, day).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric"
  });
}
