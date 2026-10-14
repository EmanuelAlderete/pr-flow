import { generateLlmText, hasLlmApiKey } from "@/modules/llm-generation";
import { hasQuickNoteActionCues } from "@/modules/journal/lib/quick-note-action-cues";
import { buildQuickNoteClassificationPrompt } from "@/modules/journal/lib/quick-note-classification-prompt";
import {
  quickNoteClassificationSchema,
  toParsedClassification,
  type ParsedQuickNoteClassification
} from "@/modules/journal/lib/quick-note-classification-schema";
import { buildQuickNoteDateAnchors } from "@/modules/journal/lib/quick-note-date-anchors";
import { todayLocalDateString } from "@/modules/journal/lib/notebook-day";

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

function buildForcedExtractionPrompt(text: string, anchors: ReturnType<typeof buildQuickNoteDateAnchors>): string {
  return `${buildQuickNoteClassificationPrompt(text, anchors)}

ATENÇÃO: a resposta anterior (hipotética) com tasks: [] está ERRADA para este texto. Há compromisso futuro implícito. Devolva pelo menos uma tarefa com dueRelative adequado.`;
}

async function parseClassificationResponse(
  raw: string,
  anchors: ReturnType<typeof buildQuickNoteDateAnchors>
): Promise<ParsedQuickNoteClassification | null> {
  try {
    const parsed: unknown = JSON.parse(extractJsonCandidate(raw));
    const validated = quickNoteClassificationSchema.safeParse(parsed);
    if (!validated.success) {
      return null;
    }
    return toParsedClassification(validated.data, anchors);
  } catch {
    return null;
  }
}

export async function classifyQuickNoteWithAi(
  text: string,
  now: Date = new Date()
): Promise<ClassifyQuickNoteResult> {
  if (!hasLlmApiKey()) {
    return { ok: false };
  }

  const today = todayLocalDateString(now);
  const anchors = buildQuickNoteDateAnchors(today);
  const expectsTasks = hasQuickNoteActionCues(text);

  try {
    const raw = await generateLlmText(buildQuickNoteClassificationPrompt(text, anchors));
    let classification = await parseClassificationResponse(raw, anchors);
    if (!classification) {
      return { ok: false };
    }

    if (expectsTasks && classification.tasks.length === 0) {
      const retryRaw = await generateLlmText(buildForcedExtractionPrompt(text, anchors));
      const retryClassification = await parseClassificationResponse(retryRaw, anchors);
      if (retryClassification && retryClassification.tasks.length > 0) {
        classification = retryClassification;
      }
    }

    return { ok: true, classification };
  } catch {
    return { ok: false };
  }
}
