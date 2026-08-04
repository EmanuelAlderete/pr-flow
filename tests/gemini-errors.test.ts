import { describe, expect, it } from "vitest";
import { ApiError } from "@google/genai";
import {
  GeminiGenerationError,
  GeminiRateLimitError,
  isGeminiRateLimitError,
  isGeminiTransientError,
  toGeminiRateLimitError,
  toGeminiTransientError
} from "@/modules/llm-generation";

describe("gemini-errors", () => {
  it("detecta ApiError 429", () => {
    const error = new ApiError({ status: 429, message: "RESOURCE_EXHAUSTED" });
    expect(isGeminiRateLimitError(error)).toBe(true);
  });

  it("detecta payload com spending cap na mensagem", () => {
    const error = new Error(
      'Your project has exceeded its monthly spending cap. status RESOURCE_EXHAUSTED'
    );
    expect(isGeminiRateLimitError(error)).toBe(true);
  });

  it("converte para GeminiRateLimitError amigável", () => {
    const error = new ApiError({ status: 429, message: "quota" });
    const mapped = toGeminiRateLimitError(error);
    expect(mapped).toBeInstanceOf(GeminiRateLimitError);
    expect(mapped.message).toMatch(/limite de uso/i);
  });

  it("detecta ApiError 503 como erro transitório", () => {
    const error = new ApiError({
      status: 503,
      message:
        "This model is currently experiencing high demand. Spikes in demand are usually temporary. Please try again later."
    });
    expect(isGeminiTransientError(error)).toBe(true);
    expect(isGeminiRateLimitError(error)).toBe(false);
  });

  it("detecta payload UNAVAILABLE aninhado", () => {
    const error = {
      error: {
        code: 503,
        message: "This model is currently experiencing high demand.",
        status: "UNAVAILABLE"
      }
    };
    expect(isGeminiTransientError(error)).toBe(true);
  });

  it("converte erro transitório para mensagem amigável em pt-BR", () => {
    const error = new ApiError({ status: 503, message: "UNAVAILABLE" });
    const mapped = toGeminiTransientError(error);
    expect(mapped).toBeInstanceOf(GeminiGenerationError);
    expect(mapped.message).toMatch(/temporariamente indisponíveis/i);
  });
});
