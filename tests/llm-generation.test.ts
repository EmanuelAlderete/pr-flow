import { afterEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "@google/genai";
import {
  createGeminiLlmGenerator,
  createInMemoryLlmGenerator,
  GeminiConfigError,
  generateGeminiTextWithRetry,
  getDefaultLlmGenerator,
  getGeminiModelCandidates,
  setDefaultLlmGenerator
} from "@/modules/llm-generation";

vi.mock("@google/genai", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@google/genai")>();
  return {
    ...actual,
    GoogleGenAI: vi.fn()
  };
});

describe("llm-generation", () => {
  const originalApiKey = process.env.GEMINI_API_KEY;
  const originalModel = process.env.GEMINI_MODEL;
  const originalFallback = process.env.GEMINI_MODEL_FALLBACK;

  afterEach(() => {
    setDefaultLlmGenerator(null);
    vi.clearAllMocks();
    if (originalApiKey === undefined) {
      delete process.env.GEMINI_API_KEY;
    } else {
      process.env.GEMINI_API_KEY = originalApiKey;
    }
    if (originalModel === undefined) {
      delete process.env.GEMINI_MODEL;
    } else {
      process.env.GEMINI_MODEL = originalModel;
    }
    if (originalFallback === undefined) {
      delete process.env.GEMINI_MODEL_FALLBACK;
    } else {
      process.env.GEMINI_MODEL_FALLBACK = originalFallback;
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

  describe("getGeminiModelCandidates", () => {
    it("deduplica primário, fallback do env e defaults", () => {
      process.env.GEMINI_MODEL = "gemini-2.5-flash-lite";
      process.env.GEMINI_MODEL_FALLBACK = "gemini-2.0-flash, gemini-2.5-flash-lite";

      expect(getGeminiModelCandidates()).toEqual([
        "gemini-2.5-flash-lite",
        "gemini-2.0-flash",
        "gemini-2.5-flash",
        "gemini-2.0-flash-lite"
      ]);
    });
  });

  describe("generateGeminiTextWithRetry", () => {
    it("retenta em 503 e conclui na tentativa seguinte", async () => {
      const generateContent = vi
        .fn()
        .mockRejectedValueOnce(new ApiError({ status: 503, message: "UNAVAILABLE" }))
        .mockResolvedValueOnce({ text: "  corpo gerado  " });

      const { GoogleGenAI } = await import("@google/genai");
      vi.mocked(GoogleGenAI).mockImplementation(function MockGoogleGenAI() {
        return {
          models: { generateContent }
        } as unknown as InstanceType<typeof GoogleGenAI>;
      });

      const sleep = vi.fn().mockResolvedValue(undefined);

      await expect(
        generateGeminiTextWithRetry("test-key", "prompt", {
          models: ["gemini-test"],
          maxAttemptsPerModel: 2,
          sleep
        })
      ).resolves.toBe("corpo gerado");

      expect(generateContent).toHaveBeenCalledTimes(2);
      expect(generateContent).toHaveBeenNthCalledWith(1, {
        model: "gemini-test",
        contents: "prompt"
      });
      expect(sleep).toHaveBeenCalledWith(1500);
    });

    it("pula modelo com 429 e tenta o próximo", async () => {
      const generateContent = vi
        .fn()
        .mockRejectedValueOnce(new ApiError({ status: 429, message: "quota" }))
        .mockResolvedValueOnce({ text: "via segundo modelo" });

      const { GoogleGenAI } = await import("@google/genai");
      vi.mocked(GoogleGenAI).mockImplementation(function MockGoogleGenAI() {
        return {
          models: { generateContent }
        } as unknown as InstanceType<typeof GoogleGenAI>;
      });

      await expect(
        generateGeminiTextWithRetry("test-key", "prompt", {
          models: ["primary", "fallback"],
          maxAttemptsPerModel: 1
        })
      ).resolves.toBe("via segundo modelo");

      expect(generateContent).toHaveBeenCalledTimes(2);
    });

    it("troca de modelo quando o primário permanece indisponível", async () => {
      const generateContent = vi
        .fn()
        .mockRejectedValueOnce(new ApiError({ status: 503, message: "high demand" }))
        .mockRejectedValueOnce(new ApiError({ status: 503, message: "high demand" }))
        .mockResolvedValueOnce({ text: "via fallback" });

      const { GoogleGenAI } = await import("@google/genai");
      vi.mocked(GoogleGenAI).mockImplementation(function MockGoogleGenAI() {
        return {
          models: { generateContent }
        } as unknown as InstanceType<typeof GoogleGenAI>;
      });

      const sleep = vi.fn().mockResolvedValue(undefined);

      await expect(
        generateGeminiTextWithRetry("test-key", "prompt", {
          models: ["primary", "fallback"],
          maxAttemptsPerModel: 2,
          sleep
        })
      ).resolves.toBe("via fallback");

      expect(generateContent).toHaveBeenCalledTimes(3);
      expect(generateContent).toHaveBeenNthCalledWith(3, {
        model: "fallback",
        contents: "prompt"
      });
    });

    it("falha com mensagem amigável após esgotar todos os modelos", async () => {
      const generateContent = vi
        .fn()
        .mockRejectedValue(new ApiError({ status: 503, message: "high demand" }));

      const { GoogleGenAI } = await import("@google/genai");
      vi.mocked(GoogleGenAI).mockImplementation(function MockGoogleGenAI() {
        return {
          models: { generateContent }
        } as unknown as InstanceType<typeof GoogleGenAI>;
      });

      const sleep = vi.fn().mockResolvedValue(undefined);

      await expect(
        generateGeminiTextWithRetry("test-key", "prompt", {
          models: ["primary", "fallback"],
          maxAttemptsPerModel: 2,
          sleep
        })
      ).rejects.toMatchObject({
        message: expect.stringMatching(/temporariamente indisponíveis/i)
      });

      expect(generateContent).toHaveBeenCalledTimes(4);
      expect(sleep).toHaveBeenCalledTimes(2);
    });
  });
});
