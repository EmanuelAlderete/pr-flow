/**
 * Lightweight Portuguese action-cue scan for quick-note classification.
 * Biases the LLM toward extracting embedded tasks from narrative captures.
 *
 * Note: JS `\b` is ASCII-only, so accented tokens (amanhã, etc.) use explicit
 * lookarounds / literal boundaries instead of `\b` around those words.
 */

const ACTION_CUE_PATTERNS: RegExp[] = [
  /amanh[ãa]\s[\s\S]{0,80}?(?:preciso|tenho que|tenho de|vou|falta)\b/i,
  /hoje\s[\s\S]{0,80}?(?:preciso|tenho que|tenho de|vou|falta)\b/i,
  /(?:preciso|tenho que|tenho de)\s[\s\S]{0,60}?(?:falar|avisar|resolver|revisar|fazer|ligar|mandar|enviar|checar|verificar|alinhar|subir|testar)\b/i,
  /(?:lembrar de|n[ãa]o esquecer|pendente)\b/i,
  /(?:falar|avisar)\s[\s\S]{0,40}?(?:na daily|com o|com a|pro|pra)\b/i,
  /ainda preciso\b/i,
  /tenho que\b/i
];

export function findQuickNoteActionCues(text: string): string[] {
  const cues: string[] = [];
  for (const pattern of ACTION_CUE_PATTERNS) {
    const match = text.match(pattern);
    if (match?.[0]) {
      const normalized = match[0].replace(/\s+/g, " ").trim();
      if (!cues.includes(normalized)) {
        cues.push(normalized);
      }
    }
  }
  return cues;
}

export function hasQuickNoteActionCues(text: string): boolean {
  return findQuickNoteActionCues(text).length > 0;
}
