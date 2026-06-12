import { generateLlmText, hasLlmApiKey } from "@/modules/llm-generation";
import { buildQuickNoteClassificationPrompt } from "@/modules/journal/lib/quick-note-classification-prompt";
import {
  quickNoteClassificationSchema,
  toParsedClassification,
  type ParsedQuickNoteClassification
} from "@/modules/journal/lib/quick-note-classification-schema";

export type ClassifyQuickNoteResult =
  | { ok: true; classification: ParsedQuickNoteClassification }
  | { ok: false };

function extractJsonCandidate(raw: string): string {
  const trimmed = raw.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced?.[1]) {
    return fenced[1].trim();
  }
  const start = trimmed.indexOf("{");
  const end = trimmed.lastIndexOf("}");
  if (start >= 0 && end > start) {
    return trimmed.slice(start, end + 1);
  }
  return trimmed;
}

export async function classifyQuickNoteWithAi(text: string): Promise<ClassifyQuickNoteResult> {
  if (!hasLlmApiKey()) {
    return { ok: false };
  }

  try {
    const raw = await generateLlmText(buildQuickNoteClassificationPrompt(text));
    const parsed: unknown = JSON.parse(extractJsonCandidate(raw));
    const validated = quickNoteClassificationSchema.safeParse(parsed);
    if (!validated.success) {
      return { ok: false };
    }

    const classification = toParsedClassification(validated.data);
    if (!classification) {
      return { ok: false };
    }

    return { ok: true, classification };
  } catch {
    return { ok: false };
  }
}
