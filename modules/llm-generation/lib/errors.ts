import { ApiError } from "@google/genai";
import { GEMINI_RATE_LIMIT_USER_MESSAGE } from "@/modules/messages";

export { GEMINI_RATE_LIMIT_USER_MESSAGE };

export const GEMINI_RATE_LIMIT_LINK = "https://ai.studio/spend";

export class GeminiRateLimitError extends Error {
  constructor(message: string = GEMINI_RATE_LIMIT_USER_MESSAGE) {
    super(message);
    this.name = "GeminiRateLimitError";
  }
}

export class GeminiConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "GeminiConfigError";
  }
}

export class GeminiGenerationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "GeminiGenerationError";
  }
}

export function isGeminiRateLimitError(error: unknown): boolean {
  if (error instanceof GeminiRateLimitError) {
    return true;
  }

  if (error instanceof ApiError && error.status === 429) {
    return true;
  }

  if (error && typeof error === "object") {
    const status = (error as { status?: number }).status;
    if (status === 429) {
      return true;
    }

    const nested = (error as { error?: { code?: number; status?: string } }).error;
    if (nested?.code === 429 || nested?.status === "RESOURCE_EXHAUSTED") {
      return true;
    }
  }

  const message = error instanceof Error ? error.message : String(error);
  return /429|RESOURCE_EXHAUSTED|spending cap|rate limit/i.test(message);
}

export function toGeminiRateLimitError(error: unknown): GeminiRateLimitError {
  if (error instanceof GeminiRateLimitError) {
    return error;
  }
  return new GeminiRateLimitError();
}
