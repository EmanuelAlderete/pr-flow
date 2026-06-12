import { beforeEach, describe, expect, it, vi } from "vitest";
import { PATCH } from "@/app/api/journal/notes/[id]/route";

const updateNoteFromInput = vi.fn();

vi.mock("@/modules/journal/lib/note-service", () => ({
  updateNoteFromInput: (...args: unknown[]) => updateNoteFromInput(...args)
}));

describe("PATCH /api/journal/notes/[id]", () => {
  beforeEach(() => {
    updateNoteFromInput.mockReset();
  });

  it("returns 200 and updated note for valid body", async () => {
    const updated = {
      id: "note-1",
      notebookDay: "2026-05-28",
      body: "Updated body",
      createdAt: "2026-05-28T11:00:00.000Z",
      updatedAt: "2026-05-28T12:00:00.000Z"
    };
    updateNoteFromInput.mockResolvedValue({ ok: true, note: updated });

    const response = await PATCH(
      new Request("http://localhost/api/journal/notes/note-1", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: "Updated body" })
      }),
      { params: Promise.resolve({ id: "note-1" }) }
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual(updated);
    expect(updateNoteFromInput).toHaveBeenCalledWith("note-1", { body: "Updated body" });
  });

  it("returns 400 with field errors for invalid body", async () => {
    updateNoteFromInput.mockResolvedValue({
      ok: false,
      status: 400,
      errors: { body: "Corpo da nota é obrigatório." }
    });

    const response = await PATCH(
      new Request("http://localhost/api/journal/notes/note-1", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: "   " })
      }),
      { params: Promise.resolve({ id: "note-1" }) }
    );

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ errors: { body: "Corpo da nota é obrigatório." } });
  });

  it("returns 404 when note is missing or removed", async () => {
    updateNoteFromInput.mockResolvedValue({ ok: false, status: 404 });

    const response = await PATCH(
      new Request("http://localhost/api/journal/notes/missing", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: "Still here" })
      }),
      { params: Promise.resolve({ id: "missing" }) }
    );

    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({ message: "Note not found." });
  });
});
