import {
  buildJournalStreak,
  JOURNAL_STREAK_STRIP_LENGTH,
  type JournalStreakSnapshot
} from "@/modules/journal/lib/journal-streak";
import { listActiveNotebookDaysBetween } from "@/modules/journal/lib/note-repository";
import { shiftNotebookDay, todayLocalDateString } from "@/modules/journal/lib/notebook-day";
import { validateNoteDaysRangeQuery } from "@/modules/journal/lib/note-days-validation";

/** Calendar lookback so a long streak is not truncated by the strip window. */
const STREAK_LOOKBACK_CALENDAR_DAYS = 400;

export type GetNoteDaysResult =
  | { ok: true; notebookDays: string[] }
  | { ok: false; errors: Record<string, string> };

export async function getNotebookDaysWithNotes(
  from: string | null,
  to: string | null
): Promise<GetNoteDaysResult> {
  const validation = validateNoteDaysRangeQuery(from, to);
  if (!validation.ok) {
    return validation;
  }

  const notebookDays = await listActiveNotebookDaysBetween(
    validation.value.from,
    validation.value.to
  );
  return { ok: true, notebookDays };
}

export async function getJournalStreakSnapshot(
  now: Date = new Date()
): Promise<JournalStreakSnapshot> {
  const today = todayLocalDateString(now);
  const from = shiftNotebookDay(today, -STREAK_LOOKBACK_CALENDAR_DAYS);
  const daysWithNote = await listActiveNotebookDaysBetween(from, today);
  return buildJournalStreak({
    today,
    daysWithNote,
    stripLength: JOURNAL_STREAK_STRIP_LENGTH
  });
}
