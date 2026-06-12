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

  it("classifica como journal", async () => {
    setDefaultLlmGenerator(
      createInMemoryLlmGenerator({
        text: '{"destination":"journal","title":null,"description":null,"dueDate":null}'
      })
    );

    const { classifyQuickNoteWithAi } = await import("@/modules/journal/lib/quick-note-classifier");
    const result = await classifyQuickNoteWithAi("Reunião com time foi produtiva");

    expect(result).toEqual({ ok: true, classification: { destination: "journal" } });
  });

  it("classifica como task com título", async () => {
    setDefaultLlmGenerator(
      createInMemoryLlmGenerator({
        text: '{"destination":"task","title":"Revisar PR 42","description":"antes do merge","dueDate":null}'
      })
    );

    const { classifyQuickNoteWithAi } = await import("@/modules/journal/lib/quick-note-classifier");
    const result = await classifyQuickNoteWithAi("revisar pr 42 antes do merge");

    expect(result).toEqual({
      ok: true,
      classification: {
        destination: "task",
        title: "Revisar PR 42",
        description: "antes do merge",
        dueDate: null
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
