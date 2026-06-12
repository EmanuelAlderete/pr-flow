import { describe, expect, it } from "vitest";
import {
  validateCreateNoteInput,
  validateUpdateNoteInput
} from "@/modules/journal/lib/note-validation";

describe("validateCreateNoteInput", () => {
  it("rejects empty or whitespace-only note body", () => {
    expect(
      validateCreateNoteInput({ notebookDay: "2026-05-28", body: "" })
    ).toEqual({
      ok: false,
      errors: { body: "Corpo da nota é obrigatório." }
    });
    expect(
      validateCreateNoteInput({ notebookDay: "2026-05-28", body: "   \n\t" })
    ).toEqual({
      ok: false,
      errors: { body: "Corpo da nota é obrigatório." }
    });
  });

  it("rejects note body longer than 20000 characters", () => {
    const result = validateCreateNoteInput({
      notebookDay: "2026-05-28",
      body: "a".repeat(20_001)
    });
    expect(result).toEqual({
      ok: false,
      errors: { body: "Corpo da nota deve ter no máximo 20000 caracteres." }
    });
  });

  it("accepts valid notebook day and trimmed body", () => {
    const result = validateCreateNoteInput({
      notebookDay: "2026-05-28",
      body: "  ## Standup\n\n- shipped journal  "
    });
    expect(result).toEqual({
      ok: true,
      value: {
        notebookDay: "2026-05-28",
        body: "## Standup\n\n- shipped journal"
      }
    });
  });
});

describe("validateUpdateNoteInput", () => {
  it("rejects empty note body on edit", () => {
    expect(validateUpdateNoteInput({ body: "  " })).toEqual({
      ok: false,
      errors: { body: "Corpo da nota é obrigatório." }
    });
  });
});
