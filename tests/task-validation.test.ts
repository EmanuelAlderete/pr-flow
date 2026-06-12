import { describe, expect, it } from "vitest";
import { validateCreateTaskInput } from "@/modules/tasks/lib/task-validation";

describe("validateCreateTaskInput", () => {
  it("rejects empty or whitespace-only title", () => {
    expect(validateCreateTaskInput({ title: "" })).toEqual({
      ok: false,
      errors: { title: "Título é obrigatório." }
    });
    expect(validateCreateTaskInput({ title: "   " })).toEqual({
      ok: false,
      errors: { title: "Título é obrigatório." }
    });
  });

  it("rejects title longer than 200 characters", () => {
    const result = validateCreateTaskInput({ title: "a".repeat(201) });
    expect(result).toEqual({
      ok: false,
      errors: { title: "Título deve ter no máximo 200 caracteres." }
    });
  });

  it("rejects description longer than 2000 characters", () => {
    const result = validateCreateTaskInput({
      title: "Valid",
      description: "a".repeat(2001)
    });
    expect(result).toEqual({
      ok: false,
      errors: { description: "Descrição deve ter no máximo 2000 caracteres." }
    });
  });

  it("stores empty description as null", () => {
    const result = validateCreateTaskInput({
      title: "Valid",
      description: "   "
    });
    expect(result).toEqual({
      ok: true,
      value: { title: "Valid", description: null, dueDate: null }
    });
  });
});
