import { describe, expect, it, vi, beforeEach } from "vitest";
import { GET, POST } from "@/app/api/tasks/route";

const getTaskLists = vi.fn();
const createTask = vi.fn();

vi.mock("@/modules/tasks/lib/task-service", () => ({
  getTaskLists: (...args: unknown[]) => getTaskLists(...args),
  createTaskFromInput: (...args: unknown[]) => createTask(...args)
}));

describe("GET /api/tasks", () => {
  beforeEach(() => {
    getTaskLists.mockReset();
    createTask.mockReset();
  });

  it("returns empty open and completed arrays on a fresh task list", async () => {
    getTaskLists.mockResolvedValue({ open: [], completed: [] });

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({ open: [], completed: [] });
    expect(getTaskLists).toHaveBeenCalledOnce();
  });
});

describe("POST /api/tasks", () => {
  beforeEach(() => {
    createTask.mockReset();
  });

  it("returns 201 and created task for valid body", async () => {
    const created = {
      id: "task-1",
      title: "Nova Task",
      description: null,
      dueDate: null,
      completedAt: null,
      createdAt: "2026-05-28T12:00:00.000Z",
      updatedAt: "2026-05-28T12:00:00.000Z"
    };
    createTask.mockResolvedValue({ ok: true, task: created });

    const response = await POST(
      new Request("http://localhost/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: "Nova Task" })
      })
    );
    const body = await response.json();

    expect(response.status).toBe(201);
    expect(body).toEqual(created);
  });

  it("returns 400 with field errors for invalid body", async () => {
    createTask.mockResolvedValue({
      ok: false,
      errors: { title: "Título é obrigatório." }
    });

    const response = await POST(
      new Request("http://localhost/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: "   " })
      })
    );
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body).toEqual({ errors: { title: "Título é obrigatório." } });
  });
});
