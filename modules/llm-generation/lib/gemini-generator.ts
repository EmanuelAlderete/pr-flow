import { GoogleGenAI } from "@google/genai";
import {
  GeminiConfigError,
  GeminiGenerationError,
  isGeminiRateLimitError,
  toGeminiRateLimitError
} from "@/modules/llm-generation/lib/errors";
import type { LlmTextGenerator } from "@/modules/llm-generation/lib/types";

export function getGeminiApiKey(): string | null {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  return apiKey ? apiKey : null;
}

export function getGeminiModel(): string {
  return process.env.GEMINI_MODEL?.trim() || "gemini-2.5-flash";
}

export function createGeminiLlmGenerator(): LlmTextGenerator {
  return {
    hasApiKey() {
      return getGeminiApiKey() !== null;
    },
    async generateText(prompt: string) {
      const apiKey = getGeminiApiKey();
      if (!apiKey) {
        throw new GeminiConfigError("GEMINI_API_KEY is not set");
      }

      try {
        const ai = new GoogleGenAI({ apiKey });
        const response = await ai.models.generateContent({
          model: getGeminiModel(),
          contents: prompt
        });

        const text = response.text?.trim();
        if (!text) {
          throw new GeminiGenerationError("Gemini returned an empty response");
        }

        return text;
      } catch (error) {
        if (isGeminiRateLimitError(error)) {
          throw toGeminiRateLimitError(error);
        }
        throw error;
      }
    }
  };
}
