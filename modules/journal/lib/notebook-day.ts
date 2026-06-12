export function localCalendarDateOnly(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function todayLocalDateString(now: Date = new Date()): string {
  return localCalendarDateOnly(now);
}

export function isTodayNotebookDay(
  notebookDay: string,
  now: Date = new Date()
): boolean {
  return notebookDay === todayLocalDateString(now);
}

export type JournalEditorMode = "edit" | "preview";

/** Hoje abre em edição; qualquer outro dia abre em preview. */
export function defaultJournalEditorMode(
  notebookDay: string,
  now: Date = new Date()
): JournalEditorMode {
  return isTodayNotebookDay(notebookDay, now) ? "edit" : "preview";
}

export function notebookDayToDate(notebookDay: string): Date {
  const [year, month, day] = notebookDay.split("-").map(Number);
  return new Date(year, month - 1, day);
}

export function shiftNotebookDay(notebookDay: string, days: number): string {
  const [year, month, day] = notebookDay.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  date.setDate(date.getDate() + days);
  return localCalendarDateOnly(date);
}

export function isCompletedOnNotebookDay(completedAt: Date, notebookDay: string): boolean {
  return localCalendarDateOnly(completedAt) === notebookDay;
}

export function isValidNotebookDay(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }
  const parsed = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}
