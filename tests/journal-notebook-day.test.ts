import { describe, expect, it } from "vitest";
import {
  defaultJournalEditorMode,
  isTodayNotebookDay
} from "@/modules/journal/lib/notebook-day";

describe("journal notebook day helpers", () => {
  const now = new Date(2026, 4, 28, 12, 0, 0);

  it("detects today", () => {
    expect(isTodayNotebookDay("2026-05-28", now)).toBe(true);
    expect(isTodayNotebookDay("2026-05-27", now)).toBe(false);
  });

  it("defaults editor mode to edit for today and preview for other days", () => {
    expect(defaultJournalEditorMode("2026-05-28", now)).toBe("edit");
    expect(defaultJournalEditorMode("2026-05-27", now)).toBe("preview");
  });
});
