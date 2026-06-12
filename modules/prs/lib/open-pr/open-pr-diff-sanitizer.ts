const MAX_HUNK_LINES = 40;
const MAX_HUNK_CHARS = 4_000;

const DIFF_HEADER_LINE =
  /^(diff --git |deleted file mode |new file mode |index |--- |\+\+\+ |similarity index |rename from |rename to |old mode |new mode )/;

type FileChangeKind = "added" | "deleted" | "modified" | "renamed";

type FileChange = {
  path: string;
  kind: FileChangeKind;
  binary: boolean;
  addedLines: number;
  removedLines: number;
  previousPath?: string;
};

function findHunkBodyStart(lines: string[]): number {
  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index] ?? "";
    if (!DIFF_HEADER_LINE.test(line)) {
      return index;
    }
  }

  return lines.length;
}

function countPatchLines(lines: string[], prefix: "+" | "-"): number {
  return lines.filter(
    (line) => line.startsWith(prefix) && !line.startsWith(`${prefix}${prefix}${prefix}`)
  ).length;
}

function parseFilePath(headerLine: string): { path: string; previousPath?: string } | null {
  const renameMatch = headerLine.match(/^diff --git a\/(.+?) b\/(.+)$/);
  if (!renameMatch) {
    return null;
  }

  const previousPath = renameMatch[1];
  const path = renameMatch[2];
  if (!path) {
    return null;
  }

  if (previousPath && previousPath !== path) {
    return { path, previousPath };
  }

  return { path };
}

function parseFileHunk(hunk: string): FileChange | null {
  const trimmed = hunk.trim();
  if (!trimmed.startsWith("diff --git ")) {
    return null;
  }

  const lines = trimmed.split("\n");
  const paths = parseFilePath(lines[0] ?? "");
  if (!paths) {
    return null;
  }

  const bodyStart = findHunkBodyStart(lines);
  const bodyLines = lines.slice(bodyStart);
  const binary = bodyLines.some((line) => /^(Binary files|GIT binary patch)/.test(line));
  const addedLines = countPatchLines(bodyLines, "+");
  const removedLines = countPatchLines(bodyLines, "-");
  const renameFrom = lines.find((line) => line.startsWith("rename from "))?.slice("rename from ".length);
  const renameTo = lines.find((line) => line.startsWith("rename to "))?.slice("rename to ".length);

  if (renameFrom && renameTo) {
    return {
      path: renameTo,
      previousPath: renameFrom,
      kind: "renamed",
      binary,
      addedLines,
      removedLines
    };
  }

  if (lines.some((line) => line.startsWith("deleted file mode "))) {
    return {
      path: paths.path,
      kind: "deleted",
      binary: binary || removedLines === 0,
      addedLines,
      removedLines
    };
  }

  if (lines.some((line) => line.startsWith("new file mode "))) {
    return {
      path: paths.path,
      kind: "added",
      binary: binary || addedLines === 0,
      addedLines,
      removedLines
    };
  }

  return {
    path: paths.path,
    kind: "modified",
    binary,
    addedLines,
    removedLines
  };
}

function formatLineDelta(addedLines: number, removedLines: number): string {
  const parts: string[] = [];
  if (addedLines > 0) {
    parts.push(`+${addedLines}`);
  }
  if (removedLines > 0) {
    parts.push(`−${removedLines}`);
  }
  return parts.length > 0 ? ` (${parts.join(", ")} linhas)` : "";
}

function formatFileChange(change: FileChange): string {
  if (change.kind === "renamed") {
    return `- renomeado: ${change.previousPath} → ${change.path}`;
  }

  if (change.binary) {
    const label =
      change.kind === "added"
        ? "adicionado (binário)"
        : change.kind === "deleted"
          ? "removido (binário)"
          : "alterado (binário)";
    return `- ${label}: ${change.path}`;
  }

  if (change.kind === "added") {
    return `- adicionado: ${change.path}${formatLineDelta(change.addedLines, change.removedLines)}`;
  }

  if (change.kind === "deleted") {
    return `- removido: ${change.path}${formatLineDelta(change.addedLines, change.removedLines)}`;
  }

  return `- modificado: ${change.path}${formatLineDelta(change.addedLines, change.removedLines)}`;
}

/** Converte diff git em lista legível, sem sintaxe de patch (evita eco do LLM). */
export function summarizeDiffForLlm(diff: string): string {
  const normalized = diff.trim();
  if (!normalized) {
    return "";
  }

  const hunks = normalized.split(/(?=^diff --git )/m).filter((part) => part.trim().length > 0);
  const changes = hunks
    .map(parseFileHunk)
    .filter((change): change is FileChange => change !== null);

  if (changes.length === 0) {
    return "(nenhuma alteração detectada no diff)";
  }

  return [`Total: ${changes.length} arquivo(s)`, ...changes.map(formatFileChange)].join("\n");
}

function summarizeLargeHunk(header: string, bodyLines: string[]): string {
  const added = countPatchLines(bodyLines, "+");
  const removed = countPatchLines(bodyLines, "-");
  return `${header}\n(${added} linhas adicionadas, ${removed} removidas — conteúdo omitido para resumo)\n`;
}

function sanitizeFileHunk(hunk: string): string {
  const trimmed = hunk.trimEnd();
  if (!trimmed.startsWith("diff --git ")) {
    return hunk;
  }

  const lines = trimmed.split("\n");
  const bodyStart = findHunkBodyStart(lines);
  const header = lines.slice(0, bodyStart).join("\n");
  const bodyLines = lines.slice(bodyStart);
  const bodyText = bodyLines.join("\n");

  if (bodyLines.some((line) => /^(Binary files|GIT binary patch)/.test(line))) {
    return `${header}\n(arquivo binário — conteúdo omitido para resumo)\n`;
  }

  if (bodyLines.length > MAX_HUNK_LINES || bodyText.length > MAX_HUNK_CHARS) {
    return summarizeLargeHunk(header, bodyLines);
  }

  return `${trimmed}\n`;
}

/** @deprecated Prefer summarizeDiffForLlm — mantido para testes legados. */
export function sanitizeDiffForLlm(diff: string): string {
  const normalized = diff.trim();
  if (!normalized) {
    return "";
  }

  const hunks = normalized.split(/(?=^diff --git )/m).filter((part) => part.trim().length > 0);
  if (hunks.length === 0) {
    return normalized;
  }

  return hunks.map(sanitizeFileHunk).join("\n").trimEnd();
}
