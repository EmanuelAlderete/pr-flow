/** Calendar-day difference from `today` (local) to `startDate` (YYYY-MM-DD). */
export function daysUntilVacation(startDate: string, today: Date = new Date()): number {
  const [year, month, day] = startDate.split("-").map(Number);
  const vacationStart = new Date(year, month - 1, day);
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const msPerDay = 24 * 60 * 60 * 1000;
  return Math.round((vacationStart.getTime() - todayStart.getTime()) / msPerDay);
}

export type VacationCountdownPhase = "upcoming" | "today" | "ongoing";

export function vacationCountdownPhase(daysRemaining: number): VacationCountdownPhase {
  if (daysRemaining > 0) {
    return "upcoming";
  }
  if (daysRemaining === 0) {
    return "today";
  }
  return "ongoing";
}
