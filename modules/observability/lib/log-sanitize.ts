const DEFAULT_MAX_LOG_MESSAGE_CHARS = 400;

export function truncateForLog(value: string, maxChars = DEFAULT_MAX_LOG_MESSAGE_CHARS): string {
  const trimmed = value.trim();
  if (trimmed.length <= maxChars) {
    return trimmed;
  }

  return `${trimmed.slice(0, maxChars)}… [truncated]`;
}

export function redactDiffLikeMessage(message: string): string {
  if (!message.includes("diff --git ")) {
    return truncateForLog(message);
  }

  return "Conteúdo de diff omitido do log — verifique open-pr:generate-body";
}

export function sanitizeErrorForLog(error: unknown): Record<string, unknown> {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: redactDiffLikeMessage(error.message)
    };
  }

  return {
    message: redactDiffLikeMessage(String(error))
  };
}

function sanitizeLogValue(value: unknown, depth = 0): unknown {
  if (depth > 4) {
    return "[max-depth]";
  }

  if (value === null || value === undefined) {
    return value;
  }

  if (typeof value === "string") {
    return redactDiffLikeMessage(value);
  }

  if (typeof value === "number" || typeof value === "boolean") {
    return value;
  }

  if (value instanceof Error) {
    return sanitizeErrorForLog(value);
  }

  if (Array.isArray(value)) {
    return value.slice(0, 20).map((entry) => sanitizeLogValue(entry, depth + 1));
  }

  if (typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>).slice(0, 20);
    return Object.fromEntries(
      entries.map(([key, entry]) => [key, sanitizeLogValue(entry, depth + 1)])
    );
  }

  return String(value);
}

export function sanitizeLogDetails(details: unknown): unknown {
  return sanitizeLogValue(details);
}
