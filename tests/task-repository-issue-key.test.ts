import { beforeEach, describe, expect, it, vi } from "vitest";

const selectMock = vi.fn();

vi.mock("@/modules/db/lib/db", () => ({
  getDb: () => ({
    select: selectMock
  })
}));

describe("listActiveTasksMentioningIssueKey", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("retorna apenas tarefas ativas que mencionam a chave", async () => {
    const where = vi.fn().mockResolvedValue([
      {
        id: "task-1",
        title: "[JOR-123] Implementar",
        description: null,
        dueDate: null,
        completedAt: null,
        createdAt: new Date("2026-05-28T10:00:00Z"),
        updatedAt: new Date("2026-05-28T10:00:00Z"),
        deletedAt: null
      },
      {
        id: "task-2",
        title: "Outra coisa",
        description: "JOR-999",
        dueDate: null,
        completedAt: null,
        createdAt: new Date("2026-05-28T10:00:00Z"),
        updatedAt: new Date("2026-05-28T10:00:00Z"),
        deletedAt: null
      }
    ]);
    const from = vi.fn().mockReturnValue({ where });
    selectMock.mockReturnValue({ from });

    const { listActiveTasksMentioningIssueKey } = await import(
      "@/modules/tasks/lib/task-repository"
    );
    const tasks = await listActiveTasksMentioningIssueKey("jor-123");

    expect(tasks).toHaveLength(1);
    expect(tasks[0]?.id).toBe("task-1");
    expect(tasks[0]?.title).toBe("[JOR-123] Implementar");
  });
});
