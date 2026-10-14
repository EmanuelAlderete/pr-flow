import { shiftNotebookDay, notebookDayToDate } from "@/modules/journal/lib/notebook-day";

export type QuickNoteDateAnchors = {
  today: string;
  tomorrow: string;
  /** Friday of the Mon–Fri work week that contains `today`. */
  endOfWorkWeek: string;
  nextMonday: string;
};

/** Friday (work-week end) of the week containing `notebookDay` (Mon–Sun week, Sunday→previous Friday). */
export function endOfWorkWeekNotebookDay(notebookDay: string): string {
  const weekday = notebookDayToDate(notebookDay).getDay(); // 0=Sun … 5=Fri … 6=Sat
  const daysUntilFriday = weekday === 0 ? -2 : weekday === 6 ? -1 : 5 - weekday;
  return shiftNotebookDay(notebookDay, daysUntilFriday);
}

export function nextMondayNotebookDay(notebookDay: string): string {
  const weekday = notebookDayToDate(notebookDay).getDay();
  const daysUntilMonday = weekday === 0 ? 1 : weekday === 1 ? 7 : 8 - weekday;
  return shiftNotebookDay(notebookDay, daysUntilMonday);
}

export function buildQuickNoteDateAnchors(today: string): QuickNoteDateAnchors {
  return {
    today,
    tomorrow: shiftNotebookDay(today, 1),
    endOfWorkWeek: endOfWorkWeekNotebookDay(today),
    nextMonday: nextMondayNotebookDay(today)
  };
}

const MS_PER_DAY = 24 * 60 * 60 * 1000;

/** Drop LLM due dates that are absurd relative to today (hallucinations). */
export function sanitizeQuickNoteDueDate(
  dueDate: string | null,
  today: string
): string | null {
  if (dueDate === null) {
    return null;
  }
  const due = notebookDayToDate(dueDate).getTime();
  const base = notebookDayToDate(today).getTime();
  if (Number.isNaN(due) || Number.isNaN(base)) {
    return null;
  }
  const deltaDays = Math.round((due - base) / MS_PER_DAY);
  if (deltaDays < -7 || deltaDays > 365) {
    return null;
  }
  return dueDate;
}
