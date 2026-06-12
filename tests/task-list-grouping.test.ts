import { describe, expect, it } from "vitest";
import { groupTasksByList } from "@/modules/tasks/lib/task-list-grouping";
import type { TaskRecord } from "@/modules/tasks/lib/domain";

function task(overrides: Partial<TaskRecord> & Pick<TaskRecord, "id" | "title">): TaskRecord {
  const now = new Date("2026-05-28T12:00:00.000Z");
  return {
    description: null,
    dueDate: null,
    completedAt: null,
    createdAt: now,
    updatedAt: now,
    ...overrides
  };
}

describe("groupTasksByList", () => {
  it("puts open tasks in open and completed tasks from the requested day in completed", () => {
    const today = new Date("2026-05-28T12:00:00.000Z");
    const rows: TaskRecord[] = [
      task({ id: "open-1", title: "Active" }),
      task({ id: "done-1", title: "Done", completedAt: new Date("2026-05-28T10:00:00.000Z") })
    ];

    const result = groupTasksByList(rows, today, "2026-05-28");

    expect(result.open.map((t) => t.id)).toEqual(["open-1"]);
    expect(result.completed.map((t) => t.id)).toEqual(["done-1"]);
  });

  it("excludes completed tasks from other notebook days", () => {
    const today = new Date("2026-05-28T12:00:00.000Z");
    const rows: TaskRecord[] = [
      task({ id: "done-today", title: "Today", completedAt: new Date("2026-05-28T18:00:00.000Z") }),
      task({ id: "done-yesterday", title: "Yesterday", completedAt: new Date("2026-05-27T20:00:00.000Z") })
    ];

    const result = groupTasksByList(rows, today, "2026-05-28");

    expect(result.completed.map((t) => t.id)).toEqual(["done-today"]);
  });

  it("returns empty lists when there are no tasks", () => {
    expect(groupTasksByList([])).toEqual({ open: [], completed: [] });
  });
});
