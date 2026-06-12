import { beforeEach, describe, expect, it, vi } from "vitest";
import { PATCH } from "@/app/api/tasks/[id]/route";

const patchTaskById = vi.fn();

vi.mock("@/modules/tasks/lib/task-service", () => ({
  patchTaskById: (...args: unknown[]) => patchTaskById(...args)
}));

describe("PATCH /api/tasks/[id]", () => {
  beforeEach(() => {
    patchTaskById.mockReset();
  });

  it("completes an open task", async () => {
    patchTaskById.mockResolvedValue({
      ok: true,
      task: {
        id: "task-1",
        title: "Done",
        description: null,
        dueDate: null,
        completedAt: "2026-05-28T12:00:00.000Z",
        createdAt: "2026-05-28T11:00:00.000Z",
        updatedAt: "2026-05-28T12:00:00.000Z"
      }
    });

    const response = await PATCH(
      new Request("http://localhost/api/tasks/task-1", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "complete" })
      }),
      { params: Promise.resolve({ id: "task-1" }) }
    );

    expect(response.status).toBe(200);
    expect(patchTaskById).toHaveBeenCalledWith("task-1", { action: "complete" });
  });

  it("returns 404 when task is missing", async () => {
    patchTaskById.mockResolvedValue({ ok: false, status: 404 });

    const response = await PATCH(
      new Request("http://localhost/api/tasks/missing", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reopen" })
      }),
      { params: Promise.resolve({ id: "missing" }) }
    );

    expect(response.status).toBe(404);
  });
});
