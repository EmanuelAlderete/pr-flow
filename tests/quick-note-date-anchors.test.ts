import { describe, expect, it } from "vitest";
import {
  buildQuickNoteDateAnchors,
  endOfWorkWeekNotebookDay,
  nextMondayNotebookDay,
  sanitizeQuickNoteDueDate
} from "@/modules/journal/lib/quick-note-date-anchors";
import { buildQuickNoteClassificationPrompt } from "@/modules/journal/lib/quick-note-classification-prompt";
import {
  quickNoteClassificationSchema,
  resolveDueDateFromClassification,
  toParsedClassification
} from "@/modules/journal/lib/quick-note-classification-schema";

describe("quick-note-date-anchors", () => {
  it("maps Tuesday to Friday of the same work week", () => {
    // 2026-08-11 is a Tuesday
    expect(endOfWorkWeekNotebookDay("2026-08-11")).toBe("2026-08-14");
  });

  it("maps Saturday to the Friday that just ended", () => {
    expect(endOfWorkWeekNotebookDay("2026-08-15")).toBe("2026-08-14");
  });

  it("maps next Monday from mid-week", () => {
    expect(nextMondayNotebookDay("2026-08-11")).toBe("2026-08-17");
  });

  it("builds anchors for today", () => {
    expect(buildQuickNoteDateAnchors("2026-08-11")).toEqual({
      today: "2026-08-11",
      tomorrow: "2026-08-12",
      endOfWorkWeek: "2026-08-14",
      nextMonday: "2026-08-17"
    });
  });

  it("drops due dates more than a year away", () => {
    expect(sanitizeQuickNoteDueDate("2028-01-01", "2026-08-11")).toBeNull();
  });

  it("keeps near-term absolute due dates", () => {
    expect(sanitizeQuickNoteDueDate("2026-08-14", "2026-08-11")).toBe("2026-08-14");
  });
});

describe("resolveDueDateFromClassification", () => {
  const anchors = buildQuickNoteDateAnchors("2026-08-11");

  it("resolves end_of_work_week to Friday instead of trusting a hallucinated absolute date", () => {
    expect(
      resolveDueDateFromClassification(
        { dueRelative: "end_of_work_week", dueDate: "2026-10-29" },
        anchors
      )
    ).toBe("2026-08-14");
  });

  it("keeps absolute dueDate only when dueRelative is absent", () => {
    expect(
      resolveDueDateFromClassification({ dueDate: "2026-08-20", dueRelative: null }, anchors)
    ).toBe("2026-08-20");
  });
});

describe("quick-note classification prompt anchors", () => {
  it("asks for dueRelative for week-end phrases", () => {
    const prompt = buildQuickNoteClassificationPrompt(
      "preciso resolver o deploy até o final dessa semana",
      buildQuickNoteDateAnchors("2026-08-11")
    );

    expect(prompt).toContain("hoje = 2026-08-11");
    expect(prompt).toContain('dueRelative "end_of_work_week"');
    expect(prompt).toContain("end_of_work_week (sexta do período útil seg–sex) → 2026-08-14");
    expect(prompt).not.toContain('"destination"');
  });
});

describe("toParsedClassification", () => {
  it("resolves relative due dates via anchors", () => {
    const validated = quickNoteClassificationSchema.parse({
      tasks: [
        {
          title: "Resolver deploy",
          description: null,
          dueDate: null,
          dueRelative: "end_of_work_week"
        }
      ]
    });

    expect(toParsedClassification(validated, buildQuickNoteDateAnchors("2026-08-11"))).toEqual({
      tasks: [
        {
          title: "Resolver deploy",
          description: null,
          dueDate: "2026-08-14"
        }
      ]
    });
  });
});
