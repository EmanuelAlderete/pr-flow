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

  it("sempre salva no caderno quando IA não extrai tarefas", async () => {
    classifyQuickNoteWithAi.mockResolvedValue({
      ok: true,
      classification: { tasks: [] }
    });

    const { submitQuickNote } = await import("@/modules/journal/lib/quick-note-submit-service");
    const result = await submitQuickNote({ text: "Ideia do standup" });

    expect(result).toEqual({
      ok: true,
      routedBy: "ai",
      note,
      tasks: []
    });
    expect(appendQuickNoteToToday).toHaveBeenCalled();
    expect(createTaskFromInput).not.toHaveBeenCalled();
  });

  it("salva no caderno e cria tarefas relacionadas", async () => {
    classifyQuickNoteWithAi.mockResolvedValue({
      ok: true,
      classification: {
        tasks: [
          {
            title: "Resolver deploy",
            description: null,
            dueDate: "2026-08-14"
          }
        ]
      }
    });
    createTaskFromInput.mockResolvedValue({
      ok: true,
      task: { ...task, title: "Resolver deploy", dueDate: "2026-08-14" }
    });

    const { submitQuickNote } = await import("@/modules/journal/lib/quick-note-submit-service");
    const result = await submitQuickNote({ text: "resolver deploy até o final dessa semana" });

    expect(result).toEqual({
      ok: true,
      routedBy: "ai",
      note,
      tasks: [{ ...task, title: "Resolver deploy", dueDate: "2026-08-14" }]
    });
    expect(appendQuickNoteToToday).toHaveBeenCalled();
    expect(createTaskFromInput).toHaveBeenCalledWith({
      title: "Resolver deploy",
      description: null,
      dueDate: "2026-08-14"
    });
  });

  it("cria várias tarefas a partir de uma captura", async () => {
    const taskB = { ...task, id: "task-2", title: "Atualizar docs" };
    classifyQuickNoteWithAi.mockResolvedValue({
      ok: true,
      classification: {
        tasks: [
          { title: "Revisar PR", description: null, dueDate: null },
          { title: "Atualizar docs", description: null, dueDate: null }
        ]
      }
    });
    createTaskFromInput
      .mockResolvedValueOnce({ ok: true, task })
      .mockResolvedValueOnce({ ok: true, task: taskB });

    const { submitQuickNote } = await import("@/modules/journal/lib/quick-note-submit-service");
    const result = await submitQuickNote({ text: "revisar pr e atualizar docs" });

    expect(result).toMatchObject({
      ok: true,
      routedBy: "ai",
      tasks: [task, taskB]
    });
    expect(createTaskFromInput).toHaveBeenCalledTimes(2);
  });

  it("usa caderno como fallback quando IA falha", async () => {
    classifyQuickNoteWithAi.mockResolvedValue({ ok: false });

    const { submitQuickNote } = await import("@/modules/journal/lib/quick-note-submit-service");
    const result = await submitQuickNote({ text: "lembrar deploy" });

    expect(result).toEqual({
      ok: true,
      routedBy: "fallback",
      note,
      tasks: []
    });
    expect(createTaskFromInput).not.toHaveBeenCalled();
  });

  it("mantém caderno mesmo se uma tarefa falhar na validação", async () => {
    classifyQuickNoteWithAi.mockResolvedValue({
      ok: true,
      classification: {
        tasks: [
          { title: "Ok", description: null, dueDate: null },
          { title: "", description: null, dueDate: null }
        ]
      }
    });
    createTaskFromInput
      .mockResolvedValueOnce({ ok: true, task })
      .mockResolvedValueOnce({
        ok: false,
        errors: { title: "Título é obrigatório." }
      });

    const { submitQuickNote } = await import("@/modules/journal/lib/quick-note-submit-service");
    const result = await submitQuickNote({ text: "x" });

    expect(result).toEqual({
      ok: true,
      routedBy: "ai",
      note,
      tasks: [task]
    });
  });
});
