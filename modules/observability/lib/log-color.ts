const RESET = "\x1b[0m";

export const logAnsi = {
  dim: "\x1b[2m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  cyan: "\x1b[36m",
  gray: "\x1b[90m",
  boldRed: "\x1b[1;31m"
} as const;

export function stdoutSupportsColor(): boolean {
  const noColor = process.env.NO_COLOR;
  if (noColor !== undefined && noColor !== "") {
    return false;
  }

  const force = process.env.FORCE_COLOR;
  if (force === "0") {
    return false;
  }
  if (force !== undefined && force !== "") {
    return true;
  }

  return Boolean(process.stdout.isTTY);
}

export function colorize(text: string, code: string, enabled = stdoutSupportsColor()): string {
  if (!enabled) {
    return text;
  }
  return `${code}${text}${RESET}`;
}
