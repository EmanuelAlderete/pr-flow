/**
 * Geração de texto por LLM (seam compartilhado).
 * Consumers: dashboard (briefing), summaries (daily/weekly).
 */

export type { LlmTextGenerator } from "@/modules/llm-generation/lib/types";

export { createInMemoryLlmGenerator } from "@/modules/llm-generation/lib/in-memory-generator";

export {
  createGeminiLlmGenerator,
  getGeminiApiKey,
  getGeminiModel
} from "@/modules/llm-generation/lib/gemini-generator";

export {
  GeminiConfigError,
  GeminiGenerationError,
  GeminiRateLimitError,
  GEMINI_RATE_LIMIT_LINK,
  GEMINI_RATE_LIMIT_USER_MESSAGE,
  isGeminiRateLimitError,
  toGeminiRateLimitError
} from "@/modules/llm-generation/lib/errors";

import { createGeminiLlmGenerator } from "@/modules/llm-generation/lib/gemini-generator";
import type { LlmTextGenerator } from "@/modules/llm-generation/lib/types";

let defaultGenerator: LlmTextGenerator | null = null;

/** Gerador padrão (Gemini). Substituível em testes via `setDefaultLlmGenerator`. */
export function getDefaultLlmGenerator(): LlmTextGenerator {
  if (!defaultGenerator) {
    defaultGenerator = createGeminiLlmGenerator();
  }
  return defaultGenerator;
}

export function setDefaultLlmGenerator(generator: LlmTextGenerator | null): void {
  defaultGenerator = generator;
}

export async function generateLlmText(prompt: string): Promise<string> {
  return getDefaultLlmGenerator().generateText(prompt);
}

export function hasLlmApiKey(): boolean {
  return getDefaultLlmGenerator().hasApiKey();
}
