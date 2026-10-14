import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { setDefaultLlmGenerator } from "@/modules/llm-generation";
import { createInMemoryLlmGenerator } from "@/modules/llm-generation/lib/in-memory-generator";

const hasLlmApiKey = vi.fn();

vi.mock("@/modules/llm-generation", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/modules/llm-generation")>();
  return {
    ...actual,
    hasLlmApiKey: () => hasLlmApiKey()
  };
});

describe("classifyQuickNoteWithAi", () => {
  beforeEach(() => {
    hasLlmApiKey.mockReturnValue(true);
  });

  afterEach(() => {
    setDefaultLlmGenerator(null);
    vi.clearAllMocks();
  });

  it("extrai lista vazia de tarefas (só caderno)", async () => {
    setDefaultLlmGenerator(
      createInMemoryLlmGenerator({
        text: '{"tasks":[]}'
      })
    );

    const { classifyQuickNoteWithAi } = await import("@/modules/journal/lib/quick-note-classifier");
    const result = await classifyQuickNoteWithAi(
      "Reunião com time foi produtiva",
      new Date(2026, 7, 11)
    );

    expect(result).toEqual({ ok: true, classification: { tasks: [] } });
  });

  it("extrai tarefa e resolve dueRelative end_of_work_week", async () => {
    setDefaultLlmGenerator(
      createInMemoryLlmGenerator({
        text: '{"tasks":[{"title":"Resolver deploy","description":null,"dueDate":null,"dueRelative":"end_of_work_week"}]}'
      })
    );

    const { classifyQuickNoteWithAi } = await import("@/modules/journal/lib/quick-note-classifier");
    const result = await classifyQuickNoteWithAi(
      "preciso resolver o deploy até o final dessa semana",
      new Date(2026, 7, 11)
    );

    expect(result).toEqual({
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
  });

  it("ignora dueDate alucinada quando dueRelative está presente", async () => {
    setDefaultLlmGenerator(
      createInMemoryLlmGenerator({
        text: '{"tasks":[{"title":"Resolver algo","description":null,"dueDate":"2026-10-29","dueRelative":"end_of_work_week"}]}'
      })
    );

    const { classifyQuickNoteWithAi } = await import("@/modules/journal/lib/quick-note-classifier");
    const result = await classifyQuickNoteWithAi(
      "preciso resolver algo até o final dessa semana",
      new Date(2026, 7, 11)
    );

    expect(result).toEqual({
      ok: true,
      classification: {
        tasks: [
          {
            title: "Resolver algo",
            description: null,
            dueDate: "2026-08-14"
          }
        ]
      }
    });
  });

  it("extrai várias tarefas", async () => {
    setDefaultLlmGenerator(
      createInMemoryLlmGenerator({
        text: '{"tasks":[{"title":"Revisar PR 42","description":null,"dueDate":null},{"title":"Atualizar docs","description":"readme","dueDate":null}]}'
      })
    );

    const { classifyQuickNoteWithAi } = await import("@/modules/journal/lib/quick-note-classifier");
    const result = await classifyQuickNoteWithAi("revisar pr 42 e atualizar docs");

    expect(result).toEqual({
      ok: true,
      classification: {
        tasks: [
          { title: "Revisar PR 42", description: null, dueDate: null },
          { title: "Atualizar docs", description: "readme", dueDate: null }
        ]
      }
    });
  });

  it("retenta extração quando há action cues e a IA devolve tasks vazias", async () => {
    let calls = 0;
    setDefaultLlmGenerator({
      hasApiKey: () => true,
      generateText: async () => {
        calls += 1;
        if (calls === 1) {
          return '{"tasks":[]}';
        }
        return '{"tasks":[{"title":"Falar da falha oab na daily e com o Brunnelo","description":"JOR-311 / GDC","dueDate":null,"dueRelative":"tomorrow"}]}';
      }
    });

    const note = `Sobre a integração com GDC (jor-311), já avisei o Christian, mas amanhã ainda preciso falar isso na daily e com o Brunnelo.`;
    const { classifyQuickNoteWithAi } = await import("@/modules/journal/lib/quick-note-classifier");
    const result = await classifyQuickNoteWithAi(note, new Date(2026, 7, 11));

    expect(calls).toBe(2);
    expect(result).toEqual({
      ok: true,
      classification: {
        tasks: [
          {
            title: "Falar da falha oab na daily e com o Brunnelo",
            description: "JOR-311 / GDC",
            dueDate: "2026-08-12"
          }
        ]
      }
    });
  });

  it("retorna falha sem chave de API", async () => {
    hasLlmApiKey.mockReturnValue(false);
    const { classifyQuickNoteWithAi } = await import("@/modules/journal/lib/quick-note-classifier");
    const result = await classifyQuickNoteWithAi("fazer deploy");
    expect(result).toEqual({ ok: false });
  });

  it("retorna falha com JSON inválido", async () => {
    setDefaultLlmGenerator(createInMemoryLlmGenerator({ text: "não é json" }));
    const { classifyQuickNoteWithAi } = await import("@/modules/journal/lib/quick-note-classifier");
    const result = await classifyQuickNoteWithAi("fazer deploy");
    expect(result).toEqual({ ok: false });
  });
});
