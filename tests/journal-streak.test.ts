import { describe, expect, it } from "vitest";
import {
  buildJournalStreak,
  isWeekdayNotebookDay,
  listRecentWeekdays,
  previousWeekdayNotebookDay
} from "@/modules/journal/lib/journal-streak";

describe("weekday helpers", () => {
  it("treats Monday–Friday as weekdays", () => {
    expect(isWeekdayNotebookDay("2026-08-03")).toBe(true); // Mon
    expect(isWeekdayNotebookDay("2026-08-07")).toBe(true); // Fri
    expect(isWeekdayNotebookDay("2026-08-08")).toBe(false); // Sat
    expect(isWeekdayNotebookDay("2026-08-09")).toBe(false); // Sun
  });

  it("skips weekends when walking backwards", () => {
    expect(previousWeekdayNotebookDay("2026-08-03")).toBe("2026-07-31"); // Mon → Fri
    expect(previousWeekdayNotebookDay("2026-08-08")).toBe("2026-08-07"); // Sat → Fri
    expect(previousWeekdayNotebookDay("2026-08-09")).toBe("2026-08-07"); // Sun → Fri
    expect(previousWeekdayNotebookDay("2026-08-04")).toBe("2026-08-03"); // Tue → Mon
  });

  it("lists recent weekdays ending on a weekend at the prior Friday", () => {
    expect(listRecentWeekdays("2026-08-08", 3)).toEqual([
      "2026-08-05",
      "2026-08-06",
      "2026-08-07"
    ]);
  });
});

describe("buildJournalStreak", () => {
  it("counts closed weekdays and marks today as pending when empty", () => {
    const snapshot = buildJournalStreak({
      today: "2026-08-05", // Wed
      daysWithNote: ["2026-08-03", "2026-08-04"],
      stripLength: 4
    });

    expect(snapshot.currentStreak).toBe(2);
    expect(snapshot.todayPending).toBe(true);
    expect(snapshot.strip).toEqual([
      { notebookDay: "2026-07-31", status: "empty" },
      { notebookDay: "2026-08-03", status: "filled" },
      { notebookDay: "2026-08-04", status: "filled" },
      { notebookDay: "2026-08-05", status: "pending" }
    ]);
  });

  it("includes today in the streak when the note already exists", () => {
    const snapshot = buildJournalStreak({
      today: "2026-08-05",
      daysWithNote: ["2026-08-03", "2026-08-04", "2026-08-05"],
      stripLength: 3
    });

    expect(snapshot.currentStreak).toBe(3);
    expect(snapshot.todayPending).toBe(false);
    expect(snapshot.strip.at(-1)).toEqual({ notebookDay: "2026-08-05", status: "filled" });
  });

  it("does not break the streak across a weekend", () => {
    const snapshot = buildJournalStreak({
      today: "2026-08-03", // Mon
      daysWithNote: ["2026-07-31", "2026-08-03"],
      stripLength: 2
    });

    expect(snapshot.currentStreak).toBe(2);
  });

  it("resets when a prior weekday is missing", () => {
    const snapshot = buildJournalStreak({
      today: "2026-08-06", // Thu pending
      daysWithNote: ["2026-08-03", "2026-08-04"], // Wed missing
      stripLength: 4
    });

    expect(snapshot.currentStreak).toBe(0);
    expect(snapshot.todayPending).toBe(true);
  });

  it("on weekend counts from Friday without a pending slot", () => {
    const snapshot = buildJournalStreak({
      today: "2026-08-08", // Sat
      daysWithNote: ["2026-08-05", "2026-08-06", "2026-08-07"],
      stripLength: 3
    });

    expect(snapshot.currentStreak).toBe(3);
    expect(snapshot.todayPending).toBe(false);
    expect(snapshot.strip.every((day) => day.status !== "pending")).toBe(true);
  });
});
