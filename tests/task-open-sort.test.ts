import { describe, expect, it } from "vitest";
import { sortOpenTasks } from "@/modules/tasks/lib/task-ordering";
import type { OpenTaskDto } from "@/modules/tasks/lib/domain";

function openTask(id: string, dueDate: string | null): OpenTaskDto {
  const stamp = "2026-05-28T12:00:00.000Z";
  return {
    id,
    title: id,
    description: null,
    dueDate,
    completedAt: null,
    createdAt: stamp,
    updatedAt: stamp,
    isOverdue: false
  };
}

describe("sortOpenTasks", () => {
  it("sorts by due date ascending with null due dates last", () => {
    const sorted = sortOpenTasks([
      openTask("no-date", null),
      openTask("late", "2026-05-30"),
      openTask("soon", "2026-05-20")
    ]);

    expect(sorted.map((t) => t.id)).toEqual(["soon", "late", "no-date"]);
  });
});
