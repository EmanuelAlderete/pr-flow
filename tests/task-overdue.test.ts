import { describe, expect, it } from "vitest";
import { isTaskOverdue, localCalendarDateOnly } from "@/modules/tasks/lib/task-overdue";

describe("isTaskOverdue", () => {
  const today = new Date(2026, 4, 28);

  it("marks due date before today as overdue", () => {
    expect(isTaskOverdue("2026-05-27", today)).toBe(true);
  });

  it("does not mark due today or later as overdue", () => {
    expect(isTaskOverdue(localCalendarDateOnly(today), today)).toBe(false);
    expect(isTaskOverdue("2026-05-29", today)).toBe(false);
  });

  it("does not mark tasks without due date as overdue", () => {
    expect(isTaskOverdue(null, today)).toBe(false);
  });
});
