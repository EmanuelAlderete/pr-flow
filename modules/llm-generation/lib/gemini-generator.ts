import { GoogleGenAI } from "@google/genai";
import {
  GeminiConfigError,
  GeminiGenerationError,
  isGeminiModelNotFoundError,
  isGeminiRateLimitError,
  isGeminiTransientError,
  toGeminiRateLimitError,
  toGeminiTransientError
} from "@/modules/llm-generation/lib/errors";
import type { LlmTextGenerator } from "@/modules/llm-generation/lib/types";

export const GEMINI_MAX_ATTEMPTS_PER_MODEL = 2;
export const GEMINI_RETRY_BASE_DELAY_MS = 1500;

export const DEFAULT_GEMINI_FALLBACK_MODELS = [
  "gemini-2.5-flash",
  "gemini-2.5-flash-lite",
  "gemini-2.0-flash",
  "gemini-2.0-flash-lite"
] as const;

/** @deprecated Use GEMINI_MAX_ATTEMPTS_PER_MODEL */
export const GEMINI_MAX_ATTEMPTS = GEMINI_MAX_ATTEMPTS_PER_MODEL;

export function getGeminiApiKey(): string | null {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  return apiKey ? apiKey : null;
}

export function getGeminiModel(): string {
  return process.env.GEMINI_MODEL?.trim() || "gemini-2.5-flash";
}

export function getGeminiModelCandidates(): string[] {
  const primary = getGeminiModel();
  const fromEnv =
    process.env.GEMINI_MODEL_FALLBACK?.split(",")
      .map((model) => model.trim())
      .filter(Boolean) ?? [];

  return [...new Set([primary, ...fromEnv, ...DEFAULT_GEMINI_FALLBACK_MODELS])];
}

export async function sleepMs(ms: number): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

async function generateGeminiTextOnce(
  apiKey: string,
  prompt: string,
  model: string
): Promise<string> {
  const ai = new GoogleGenAI({ apiKey });
  const response = await ai.models.generateContent({
    model,
    contents: prompt
  });

  const text = response.text?.trim();
  if (!text) {
    throw new GeminiGenerationError("Gemini returned an empty response");
  }

  return text;
}

export async function generateGeminiTextWithRetry(
  apiKey: string,
  prompt: string,
  options?: {
    models?: string[];
    maxAttemptsPerModel?: number;
    sleep?: (ms: number) => Promise<void>;
  }
): Promise<string> {
  const models = options?.models ?? getGeminiModelCandidates();
  const maxAttemptsPerModel = options?.maxAttemptsPerModel ?? GEMINI_MAX_ATTEMPTS_PER_MODEL;
  const sleep = options?.sleep ?? sleepMs;
  let lastError: unknown;

  for (const model of models) {
    for (let attempt = 1; attempt <= maxAttemptsPerModel; attempt++) {
      try {
        return await generateGeminiTextOnce(apiKey, prompt, model);
      } catch (error) {
        if (isGeminiModelNotFoundError(error)) {
          lastError = error;
          break;
        }

        if (isGeminiRateLimitError(error)) {
          lastError = error;
          break;
        }

        if (isGeminiTransientError(error)) {
          lastError = error;
          if (attempt < maxAttemptsPerModel) {
            await sleep(GEMINI_RETRY_BASE_DELAY_MS * 2 ** (attempt - 1));
            continue;
          }
          break;
        }

        throw error;
      }
    }
  }

  if (lastError && isGeminiRateLimitError(lastError)) {
    throw toGeminiRateLimitError(lastError);
  }

  throw toGeminiTransientError(lastError);
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

      return generateGeminiTextWithRetry(apiKey, prompt);
    }
  };
}
