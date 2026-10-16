import { zonedDayUtcRange } from "@/modules/day-calendar/lib/day-calendar-timezone";
import { isWeekdayNotebookDay } from "@/modules/journal/lib/journal-streak";
import { shiftNotebookDay } from "@/modules/journal/lib/notebook-day";

/** Next Monday–Friday strictly after `notebookDay`. Friday lands on Monday. */
export function nextBusinessDay(notebookDay: string): string {
  let cursor = shiftNotebookDay(notebookDay, 1);
  while (!isWeekdayNotebookDay(cursor)) {
    cursor = shiftNotebookDay(cursor, 1);
  }
  return cursor;
}

/**
 * Quiz window stays open until the standup script is marked used
 * or the end of the next business day, whichever comes first.
 * Reading the draft does not close it. Weekends do not end a Friday.
 */
export function isQuizWindowOpen(input: {
  notebookDay: string;
  now: Date;
  timeZone: string;
  scriptUsed: boolean;
}): boolean {
  if (input.scriptUsed) {
    return false;
  }

  const deadlineDay = nextBusinessDay(input.notebookDay);
  const { to } = zonedDayUtcRange(deadlineDay, input.timeZone);
  return input.now.getTime() <= to.getTime();
}
