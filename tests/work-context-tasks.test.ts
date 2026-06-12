import { beforeEach, describe, expect, it, vi } from "vitest";

const listActiveTasksMentioningIssueKey = vi.fn();

vi.mock("@/modules/tasks/lib/task-repository", () => ({
  listActiveTasksMentioningIssueKey: (...args: unknown[]) => listActiveTasksMentioningIssueKey(...args)
}));

describe("loadWorkContextTasks", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("mapeia tarefas filtradas por chave Jira", async () => {
    listActiveTasksMentioningIssueKey.mockResolvedValue([
      {
        id: "task-1",
        title: "[JOR-123] Implementar",
        description: null,
        dueDate: null,
        completedAt: null,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]);

    const { loadWorkContextTasks } = await import("@/modules/work-context/lib/work-context-tasks");
    const tasks = await loadWorkContextTasks("jor-123");

    expect(listActiveTasksMentioningIssueKey).toHaveBeenCalledWith("JOR-123");
    expect(tasks).toEqual([
      {
        id: "task-1",
        title: "[JOR-123] Implementar",
        completed: false
      }
    ]);
  });
});
