import { beforeEach, describe, expect, it, vi } from "vitest";
import { DELETE } from "@/app/api/journal/notes/[id]/route";

const removeNoteById = vi.fn();

vi.mock("@/modules/journal/lib/note-service", () => ({
  removeNoteById: (...args: unknown[]) => removeNoteById(...args)
}));

describe("DELETE /api/journal/notes/[id]", () => {
  beforeEach(() => {
    removeNoteById.mockReset();
  });

  it("returns 204 when note is removed", async () => {
    removeNoteById.mockResolvedValue({ ok: true });

    const response = await DELETE(
      new Request("http://localhost/api/journal/notes/note-1", { method: "DELETE" }),
      { params: Promise.resolve({ id: "note-1" }) }
    );

    expect(response.status).toBe(204);
  });

  it("returns 404 when note is missing or already removed", async () => {
    removeNoteById.mockResolvedValue({ ok: false, status: 404 });

    const response = await DELETE(
      new Request("http://localhost/api/journal/notes/missing", { method: "DELETE" }),
      { params: Promise.resolve({ id: "missing" }) }
    );

    expect(response.status).toBe(404);
  });
});
