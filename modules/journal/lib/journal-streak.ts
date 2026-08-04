import { notebookDayToDate, shiftNotebookDay } from "@/modules/journal/lib/notebook-day";

export const JOURNAL_STREAK_STRIP_LENGTH = 10;

export type JournalStreakDayStatus = "filled" | "pending" | "empty";

export type JournalStreakDay = {
  notebookDay: string;
  status: JournalStreakDayStatus;
};

export type JournalStreakSnapshot = {
  currentStreak: number;
  today: string;
  todayPending: boolean;
  strip: JournalStreakDay[];
};

/** Monday–Friday in the notebook-day local calendar. */
export function isWeekdayNotebookDay(notebookDay: string): boolean {
  const weekday = notebookDayToDate(notebookDay).getDay();
  return weekday >= 1 && weekday <= 5;
}

/**
 * Previous weekday strictly before `notebookDay`.
 * Monday → prior Friday; Saturday/Sunday → prior Friday.
 */
export function previousWeekdayNotebookDay(notebookDay: string): string {
  const weekday = notebookDayToDate(notebookDay).getDay();
  if (weekday === 1) {
    return shiftNotebookDay(notebookDay, -3);
  }
  if (weekday === 0) {
    return shiftNotebookDay(notebookDay, -2);
  }
  if (weekday === 6) {
    return shiftNotebookDay(notebookDay, -1);
  }
  return shiftNotebookDay(notebookDay, -1);
}

/** Last `count` weekdays ending on `endDay` (or the Friday before if `endDay` is a weekend). */
export function listRecentWeekdays(endDay: string, count: number): string[] {
  if (count <= 0) {
    return [];
  }

  let cursor = isWeekdayNotebookDay(endDay) ? endDay : previousWeekdayNotebookDay(endDay);
  const days: string[] = [];
  while (days.length < count) {
    days.unshift(cursor);
    cursor = previousWeekdayNotebookDay(cursor);
  }
  return days;
}

export function buildJournalStreak(input: {
  today: string;
  daysWithNote: Iterable<string>;
  stripLength?: number;
}): JournalStreakSnapshot {
  const stripLength = input.stripLength ?? JOURNAL_STREAK_STRIP_LENGTH;
  const noteSet = new Set(input.daysWithNote);
  const { today } = input;

  const todayIsWeekday = isWeekdayNotebookDay(today);
  const todayHasNote = noteSet.has(today);
  const todayPending = todayIsWeekday && !todayHasNote;

  let streakCursor =
    todayIsWeekday && todayHasNote ? today : previousWeekdayNotebookDay(today);

  let currentStreak = 0;
  while (noteSet.has(streakCursor)) {
    currentStreak += 1;
    streakCursor = previousWeekdayNotebookDay(streakCursor);
  }

  const strip = listRecentWeekdays(today, stripLength).map((notebookDay) => {
    if (noteSet.has(notebookDay)) {
      return { notebookDay, status: "filled" as const };
    }
    if (notebookDay === today && todayPending) {
      return { notebookDay, status: "pending" as const };
    }
    return { notebookDay, status: "empty" as const };
  });

  return {
    currentStreak,
    today,
    todayPending,
    strip
  };
}
