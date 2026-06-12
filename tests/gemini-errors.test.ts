import { describe, expect, it } from "vitest";
import { ApiError } from "@google/genai";
import {
  GeminiRateLimitError,
  isGeminiRateLimitError,
  toGeminiRateLimitError
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
});
