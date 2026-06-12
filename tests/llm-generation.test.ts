import { afterEach, describe, expect, it } from "vitest";
import {
  createGeminiLlmGenerator,
  createInMemoryLlmGenerator,
  GeminiConfigError,
  getDefaultLlmGenerator,
  setDefaultLlmGenerator
} from "@/modules/llm-generation";

describe("llm-generation", () => {
  const originalApiKey = process.env.GEMINI_API_KEY;

  afterEach(() => {
    setDefaultLlmGenerator(null);
    if (originalApiKey === undefined) {
      delete process.env.GEMINI_API_KEY;
    } else {
      process.env.GEMINI_API_KEY = originalApiKey;
    }
  });

  describe("createInMemoryLlmGenerator", () => {
    it("retorna o texto configurado para qualquer prompt", async () => {
      const generator = createInMemoryLlmGenerator({ text: "Resposta fixa" });

      await expect(generator.generateText("prompt qualquer")).resolves.toBe("Resposta fixa");
      expect(generator.hasApiKey()).toBe(true);
    });
  });

  describe("createGeminiLlmGenerator", () => {
    it("indica ausência de chave e falha ao gerar sem GEMINI_API_KEY", async () => {
      delete process.env.GEMINI_API_KEY;
      const generator = createGeminiLlmGenerator();

      expect(generator.hasApiKey()).toBe(false);
      await expect(generator.generateText("prompt")).rejects.toBeInstanceOf(GeminiConfigError);
    });
  });

  describe("getDefaultLlmGenerator", () => {
    it("usa gerador injetado via setDefaultLlmGenerator", async () => {
      setDefaultLlmGenerator(createInMemoryLlmGenerator({ text: "via default" }));

      await expect(getDefaultLlmGenerator().generateText("x")).resolves.toBe("via default");
    });
  });
});
