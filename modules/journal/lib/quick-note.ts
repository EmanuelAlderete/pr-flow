export function formatQuickNoteTimestamp(date: Date): string {
  return date.toLocaleString("pt-BR", {
    dateStyle: "short",
    timeStyle: "short"
  });
}

export function buildQuickNoteBlock(text: string, now: Date = new Date()): string {
  const timestamp = formatQuickNoteTimestamp(now);
  return `### quick-note (${timestamp}):\n${text.trim()}`;
}

export function appendQuickNoteToBody(
  existingBody: string,
  quickNoteText: string,
  now: Date = new Date()
): string {
  const block = buildQuickNoteBlock(quickNoteText, now);
  const trimmed = existingBody.trim();
  return trimmed.length === 0 ? block : `${trimmed}\n\n${block}`;
}

export function isQuickNoteOpenShortcut(event: Pick<KeyboardEvent, "key" | "code" | "ctrlKey" | "metaKey" | "altKey" | "shiftKey">): boolean {
  return (
    (event.key === " " || event.code === "Space") &&
    (event.ctrlKey || event.metaKey) &&
    !event.altKey &&
    !event.shiftKey
  );
}
