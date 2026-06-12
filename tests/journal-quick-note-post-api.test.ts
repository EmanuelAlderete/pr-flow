import { beforeEach, describe, expect, it, vi } from "vitest";
import { POST } from "@/app/api/journal/quick-note/route";

const submitQuickNote = vi.fn();

vi.mock("@/modules/journal/lib/quick-note-submit-service", () => ({
  submitQuickNote: (...args: unknown[]) => submitQuickNote(...args)
}));

describe("POST /api/journal/quick-note", () => {
  beforeEach(() => {
    submitQuickNote.mockReset();
  });

  it("returns 200 with journal payload for valid body", async () => {
    const note = {
      id: "note-1",
      notebookDay: "2026-05-29",
      body: "### quick-note (29/05/2026, 14:30):\nIdeia",
      createdAt: "2026-05-29T12:00:00.000Z",
      updatedAt: "2026-05-29T14:30:00.000Z"
    };
    submitQuickNote.mockResolvedValue({
      ok: true,
      destination: "journal",
      routedBy: "ai",
      note
    });

    const response = await POST(
      new Request("http://localhost/api/journal/quick-note", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: "Ideia" })
      })
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      destination: "journal",
      routedBy: "ai",
      note
    });
    expect(submitQuickNote).toHaveBeenCalledWith({ text: "Ideia" });
  });

  it("returns 201 with task payload when routed as task", async () => {
    const task = {
      id: "task-1",
      title: "Revisar PR",
      description: null,
      dueDate: null,
      completedAt: null,
      createdAt: "2026-05-29T12:00:00.000Z",
      updatedAt: "2026-05-29T12:00:00.000Z"
    };
    submitQuickNote.mockResolvedValue({
      ok: true,
      destination: "task",
      routedBy: "ai",
      task
    });

    const response = await POST(
      new Request("http://localhost/api/journal/quick-note", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: "revisar pr" })
      })
    );

    expect(response.status).toBe(201);
    expect(await response.json()).toEqual({
      destination: "task",
      routedBy: "ai",
      task
    });
  });

  it("returns 400 with field errors for invalid body", async () => {
    submitQuickNote.mockResolvedValue({
      ok: false,
      status: 400,
      errors: { text: "Texto da quick note é obrigatório." }
    });

    const response = await POST(
      new Request("http://localhost/api/journal/quick-note", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: "   " })
      })
    );

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({
      errors: { text: "Texto da quick note é obrigatório." }
    });
  });
});
