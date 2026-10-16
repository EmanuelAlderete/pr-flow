import { colorize, logAnsi, stdoutSupportsColor } from "@/modules/observability/lib/log-color";
import type { LogLevel, SystemLogEvent } from "@/modules/observability/lib/log-domain";
import { redactDiffLikeMessage } from "@/modules/observability/lib/log-sanitize";

function normalizeDetails(details: unknown): unknown | undefined {
  if (details === undefined || details === null) {
    return undefined;
  }
  if (typeof details === "string") {
    const trimmed = details.trim();
    if (!trimmed) {
      return undefined;
    }
    try {
      return JSON.parse(trimmed) as unknown;
    } catch {
      return details;
    }
  }
  return details;
}

function resolveLogFormat(): "json" | "pretty" {
  const env = process.env.LOG_FORMAT?.toLowerCase();
  if (env === "pretty") {
    return "pretty";
  }
  if (env === "json") {
    return "json";
  }

  if (process.env.NODE_ENV === "production") {
    return "json";
  }

  return "pretty";
}

function buildEvent(input: {
  level: LogLevel;
  source: string;
  message: string;
  details?: unknown;
}): SystemLogEvent {
  const details = normalizeDetails(input.details);
  const event: SystemLogEvent = {
    timestamp: new Date().toISOString(),
    level: input.level,
    source: input.source,
    message: redactDiffLikeMessage(input.message)
  };

  if (details !== undefined) {
    event.details = details;
  }

  return event;
}

function levelAnsi(level: LogLevel): string {
  switch (level) {
    case "debug":
      return logAnsi.gray;
    case "info":
      return logAnsi.green;
    case "warn":
      return logAnsi.yellow;
    case "error":
      return logAnsi.boldRed;
  }
}

function formatPretty(event: SystemLogEvent): string {
  const enabled = stdoutSupportsColor();
  const detailsSuffix =
    event.details === undefined
      ? ""
      : ` ${colorize(JSON.stringify(event.details), logAnsi.dim, enabled)}`;
  const timestamp = colorize(event.timestamp, logAnsi.dim, enabled);
  const level = colorize(event.level, levelAnsi(event.level), enabled);
  const source = colorize(`[${event.source}]`, logAnsi.cyan, enabled);
  return `${timestamp} ${level} ${source} ${event.message}${detailsSuffix}`;
}

const MAX_LOG_LINE_BYTES = 16_000;
const MAX_MESSAGE_CHARS = 500;

function truncateEvent(event: SystemLogEvent): SystemLogEvent {
  let next: SystemLogEvent = { ...event };

  if (next.message.length > MAX_MESSAGE_CHARS) {
    next = {
      ...next,
      message: `${next.message.slice(0, MAX_MESSAGE_CHARS)}… [truncated]`
    };
  }

  let line = JSON.stringify(next);
  if (Buffer.byteLength(line, "utf8") <= MAX_LOG_LINE_BYTES) {
    return next;
  }

  return {
    ...next,
    details: "[truncated — payload too large]"
  };
}

function emit(event: SystemLogEvent): void {
  const format = resolveLogFormat();
  const safeEvent = format === "json" ? truncateEvent(event) : event;
  const line = format === "json" ? JSON.stringify(safeEvent) : formatPretty(safeEvent);
  process.stdout.write(`${line}\n`);
}

export async function writeSystemLog(input: {
  level: LogLevel;
  source: string;
  message: string;
  details?: unknown;
}): Promise<void> {
  emit(buildEvent(input));
}

export function writeSystemLogFireAndForget(
  input: Parameters<typeof writeSystemLog>[0]
): void {
  void writeSystemLog(input);
}
