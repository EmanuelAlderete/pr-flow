import { describe, expect, it } from "vitest";
import { validateNotebookDayQuery } from "@/modules/journal/lib/note-validation";

describe("validateNotebookDayQuery", () => {
  it("returns parsed notebook day for a valid query value", () => {
    expect(validateNotebookDayQuery("2026-05-28")).toEqual({
      ok: true,
      value: "2026-05-28"
    });
  });

  it("returns field errors when notebook day is missing", () => {
    expect(validateNotebookDayQuery(null)).toEqual({
      ok: false,
      errors: { notebookDay: "Notebook day é obrigatório." }
    });
  });

  it("returns field errors when notebook day is invalid", () => {
    expect(validateNotebookDayQuery("2026-99-99")).toEqual({
      ok: false,
      errors: { notebookDay: "Notebook day inválido." }
    });
  });
});
