import type { LlmTextGenerator } from "@/modules/llm-generation/lib/types";

export function createInMemoryLlmGenerator(options: { text: string }): LlmTextGenerator {
  return {
    async generateText() {
      return options.text;
    },
    hasApiKey() {
      return true;
    }
  };
}
