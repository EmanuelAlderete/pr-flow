import { beforeEach, describe, expect, it, vi } from "vitest";
import { GET } from "@/app/api/journal/notes/route";

const getActiveNoteByNotebookDay = vi.fn();

vi.mock("@/modules/journal/lib/note-repository", () => ({
  getActiveNoteByNotebookDay: (...args: unknown[]) => getActiveNoteByNotebookDay(...args)
}));

describe("GET /api/journal/notes", () => {
  beforeEach(() => {
    getActiveNoteByNotebookDay.mockReset();
  });

  it("returns note null for an empty notebook day", async () => {
    getActiveNoteByNotebookDay.mockResolvedValue(null);

    const response = await GET(
      new Request("http://localhost/api/journal/notes?notebookDay=2026-05-28")
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({ note: null });
    expect(getActiveNoteByNotebookDay).toHaveBeenCalledWith("2026-05-28");
  });

  it("returns 400 with field errors when notebook day is missing", async () => {
    const response = await GET(new Request("http://localhost/api/journal/notes"));
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body).toEqual({ errors: { notebookDay: "Notebook day é obrigatório." } });
    expect(getActiveNoteByNotebookDay).not.toHaveBeenCalled();
  });

  it("returns 400 with field errors when notebook day is invalid", async () => {
    const response = await GET(
      new Request("http://localhost/api/journal/notes?notebookDay=bad-day")
    );
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body).toEqual({ errors: { notebookDay: "Notebook day inválido." } });
    expect(getActiveNoteByNotebookDay).not.toHaveBeenCalled();
  });
});
