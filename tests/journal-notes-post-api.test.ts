import { beforeEach, describe, expect, it, vi } from "vitest";
import { POST } from "@/app/api/journal/notes/route";

const createNoteFromInput = vi.fn();

vi.mock("@/modules/journal/lib/note-service", () => ({
  getNoteForDay: vi.fn(),
  createNoteFromInput: (...args: unknown[]) => createNoteFromInput(...args)
}));

describe("POST /api/journal/notes", () => {
  beforeEach(() => {
    createNoteFromInput.mockReset();
  });

  it("returns 201 and created note for valid body", async () => {
    const created = {
      id: "note-1",
      notebookDay: "2026-05-28",
      body: "## Standup",
      createdAt: "2026-05-28T12:00:00.000Z",
      updatedAt: "2026-05-28T12:00:00.000Z"
    };
    createNoteFromInput.mockResolvedValue({ ok: true, note: created });

    const response = await POST(
      new Request("http://localhost/api/journal/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notebookDay: "2026-05-28", body: "## Standup" })
      })
    );
    const body = await response.json();

    expect(response.status).toBe(201);
    expect(body).toEqual(created);
  });

  it("returns 400 with field errors for invalid body", async () => {
    createNoteFromInput.mockResolvedValue({
      ok: false,
      status: 400,
      errors: { body: "Corpo da nota é obrigatório." }
    });

    const response = await POST(
      new Request("http://localhost/api/journal/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notebookDay: "2026-05-28", body: "   " })
      })
    );
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body).toEqual({ errors: { body: "Corpo da nota é obrigatório." } });
  });

  it("returns 409 when an active note already exists for the notebook day", async () => {
    createNoteFromInput.mockResolvedValue({ ok: false, status: 409 });

    const response = await POST(
      new Request("http://localhost/api/journal/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notebookDay: "2026-05-28", body: "Duplicate attempt" })
      })
    );
    const body = await response.json();

    expect(response.status).toBe(409);
    expect(body).toEqual({
      error: "Já existe uma Note ativa para este Notebook day."
    });
  });
});
