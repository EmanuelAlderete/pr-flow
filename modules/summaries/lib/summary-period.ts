import { addDays, format, startOfWeek, subWeeks } from "date-fns";
import { notebookDayToDate, shiftNotebookDay, todayLocalDateString } from "@/modules/journal/lib/notebook-day";

function toNotebookDay(date: Date): string {
  return format(date, "yyyy-MM-dd");
}

/** Dia civil anterior (fuso local do servidor). */
export function yesterdayLocalDay(now: Date = new Date()): string {
  return shiftNotebookDay(todayLocalDateString(now), -1);
}

/** Segunda-feira da semana que contém o dia (semana começa na segunda). */
export function weekMondayForDay(day: string): string {
  const monday = startOfWeek(notebookDayToDate(day), { weekStartsOn: 1 });
  return toNotebookDay(monday);
}

/** Segunda-feira da última semana civil completa (terminou no domingo anterior ou no próprio domingo se for domingo). */
export function lastCompletedWeekMonday(referenceDay: string = todayLocalDateString()): string {
  const ref = notebookDayToDate(referenceDay);
  const thisWeekMonday = startOfWeek(ref, { weekStartsOn: 1 });
  const lastWeekMonday = subWeeks(thisWeekMonday, 1);
  return toNotebookDay(lastWeekMonday);
}

/** Segunda a domingo (inclusive) da semana identificada por periodKey (segunda-feira). */
export function weekDayRange(weekMonday: string): string[] {
  const start = notebookDayToDate(weekMonday);
  return Array.from({ length: 7 }, (_, index) => toNotebookDay(addDays(start, index)));
}

export function isMonday(day: string): boolean {
  return notebookDayToDate(day).getDay() === 1;
}

/** Dias entre start e end (inclusive), em ordem crescente. */
export function enumerateDaysInclusive(start: string, end: string): string[] {
  const days: string[] = [];
  let current = start;
  while (current <= end) {
    days.push(current);
    if (current === end) {
      break;
    }
    current = shiftNotebookDay(current, 1);
  }
  return days;
}

export function sundayOfWeek(weekMonday: string): string {
  return shiftNotebookDay(weekMonday, 6);
}

export function dayBefore(day: string): string {
  return shiftNotebookDay(day, -1);
}

/**
 * Último dia útil (seg–sex) estritamente anterior ao dia de referência.
 * Segunda → sexta anterior; sábado/domingo → sexta anterior.
 */
export function previousBusinessDay(referenceDay: string = todayLocalDateString()): string {
  const weekday = notebookDayToDate(referenceDay).getDay();
  if (weekday === 1) {
    return shiftNotebookDay(referenceDay, -3);
  }
  if (weekday === 0) {
    return shiftNotebookDay(referenceDay, -2);
  }
  if (weekday === 6) {
    return shiftNotebookDay(referenceDay, -1);
  }
  return shiftNotebookDay(referenceDay, -1);
}

export function maxNotebookDay(a: string, b: string): string {
  return a >= b ? a : b;
}

export function minNotebookDay(a: string, b: string): string {
  return a <= b ? a : b;
}

/** Max days to backfill daily summaries after downtime. */
export const DAILY_CATCHUP_MAX_DAYS = 14;

export function catchupDailyStartDay(lastDailyPeriodKey: string | null, yesterday: string): string {
  if (!lastDailyPeriodKey) {
    return shiftNotebookDay(yesterday, -(DAILY_CATCHUP_MAX_DAYS - 1));
  }
  const nextDay = shiftNotebookDay(lastDailyPeriodKey, 1);
  const cappedStart = shiftNotebookDay(yesterday, -(DAILY_CATCHUP_MAX_DAYS - 1));
  return maxNotebookDay(nextDay, cappedStart);
}
