/** Geração de texto por LLM: prompt in → texto out. */
export type LlmTextGenerator = {
  generateText(prompt: string): Promise<string>;
  hasApiKey(): boolean;
};
