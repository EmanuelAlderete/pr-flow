const DIFF_MARKERS = [
  "diff --git ",
  "deleted file mode ",
  "new file mode ",
  "Binary files ",
  "GIT binary patch",
  "index "
] as const;

/** Detecta quando o LLM devolveu diff/patch em vez de Markdown de PR. */
export function looksLikeRawDiffOutput(text: string): boolean {
  const trimmed = text.trim();
  if (!trimmed) {
    return false;
  }

  if (DIFF_MARKERS.some((marker) => trimmed.includes(marker))) {
    return true;
  }

  const lines = trimmed.split(/\r?\n/);
  const patchLines = lines.filter(
    (line) => /^[+-]/.test(line) && !/^--- |^\+\+\+ /.test(line)
  ).length;
  const markdownHeaders = lines.filter((line) => /^#{1,6} /.test(line)).length;

  if (patchLines >= 4 && markdownHeaders === 0 && patchLines / lines.length >= 0.35) {
    return true;
  }

  return false;
}
