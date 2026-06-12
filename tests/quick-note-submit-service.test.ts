import { beforeEach, describe, expect, it, vi } from "vitest";

const classifyQuickNoteWithAi = vi.fn();
const appendQuickNoteToToday = vi.fn();
const createTaskFromInput = vi.fn();

vi.mock("@/modules/journal/lib/quick-note-classifier", () => ({
  classifyQuickNoteWithAi: (...args: unknown[]) => classifyQuickNoteWithAi(...args)
}));

vi.mock("@/modules/journal/lib/note-service", () => ({
  appendQuickNoteToToday: (...args: unknown[]) => appendQuickNoteToToday(...args)
}));

vi.mock("@/modules/tasks/lib/task-service", () => ({
  createTaskFromInput: (...args: unknown[]) => createTaskFromInput(...args)
}));

const note = {
  id: "note-1",
  notebookDay: "2026-05-29",
  body: "### quick-note:\ntexto",
  createdAt: "2026-05-29T12:00:00.000Z",
  updatedAt: "2026-05-29T12:00:00.000Z"
};

const task = {
  id: "task-1",
  title: "Revisar PR",
  description: null,
  dueDate: null,
  completedAt: null,
  createdAt: "2026-05-29T12:00:00.000Z",
  updatedAt: "2026-05-29T12:00:00.000Z"
};

describe("submitQuickNote", () => {
  beforeEach(() => {
    classifyQuickNoteWithAi.mockReset();
    appendQuickNoteToToday.mockReset();
    createTaskFromInput.mockReset();
    appendQuickNoteToToday.mockResolvedValue({ ok: true, note });
  });

  it("salva no caderno quando IA classifica journal", async () => {
    classifyQuickNoteWithAi.mockResolvedValue({
      ok: true,
      classification: { destination: "journal" }
    });

    const { submitQuickNote } = await import("@/modules/journal/lib/quick-note-submit-service");
    const result = await submitQuickNote({ text: "Ideia do standup" });

    expect(result).toEqual({
      ok: true,
      destination: "journal",
      routedBy: "ai",
      note
    });
    expect(createTaskFromInput).not.toHaveBeenCalled();
  });

  it("cria tarefa quando IA classifica task", async () => {
    classifyQuickNoteWithAi.mockResolvedValue({
      ok: true,
      classification: {
        destination: "task",
        title: "Revisar PR 42",
        description: null,
        dueDate: null
      }
    });
    createTaskFromInput.mockResolvedValue({ ok: true, task });

    const { submitQuickNote } = await import("@/modules/journal/lib/quick-note-submit-service");
    const result = await submitQuickNote({ text: "revisar pr 42" });

    expect(result).toEqual({
      ok: true,
      destination: "task",
      routedBy: "ai",
      task
    });
    expect(createTaskFromInput).toHaveBeenCalledWith({
      title: "Revisar PR 42",
      description: null,
      dueDate: null
    });
    expect(appendQuickNoteToToday).not.toHaveBeenCalled();
  });

  it("usa caderno como fallback quando IA falha", async () => {
    classifyQuickNoteWithAi.mockResolvedValue({ ok: false });

    const { submitQuickNote } = await import("@/modules/journal/lib/quick-note-submit-service");
    const result = await submitQuickNote({ text: "lembrar deploy" });

    expect(result).toEqual({
      ok: true,
      destination: "journal",
      routedBy: "fallback",
      note
    });
  });

  it("usa caderno quando criação de tarefa falha na validação", async () => {
    classifyQuickNoteWithAi.mockResolvedValue({
      ok: true,
      classification: {
        destination: "task",
        title: "",
        description: null,
        dueDate: null
      }
    });
    createTaskFromInput.mockResolvedValue({
      ok: false,
      errors: { title: "Título é obrigatório." }
    });

    const { submitQuickNote } = await import("@/modules/journal/lib/quick-note-submit-service");
    const result = await submitQuickNote({ text: "x" });

    expect(result).toMatchObject({
      ok: true,
      destination: "journal",
      routedBy: "fallback"
    });
  });
});
