import { describe, expect, it } from "vitest";
import { groupTasksByList } from "@/modules/tasks/lib/task-list-grouping";
import type { TaskRecord } from "@/modules/tasks/lib/domain";

describe("task list reads", () => {
  it("only groups active task records passed to the list builder", () => {
    const now = new Date("2026-05-28T12:00:00.000Z");
    const active: TaskRecord = {
      id: "active",
      title: "Active",
      description: null,
      dueDate: null,
      completedAt: null,
      createdAt: now,
      updatedAt: now
    };

    const result = groupTasksByList([active]);
    expect(result.open).toHaveLength(1);
    expect(result.completed).toHaveLength(0);
  });
});
