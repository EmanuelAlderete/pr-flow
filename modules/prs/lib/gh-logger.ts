import { writeFileSync, mkdirSync, existsSync, statSync, renameSync, unlinkSync } from "node:fs";
import { join } from "node:path";
import { homedir } from "node:os";
import { colorize, logAnsi, stdoutSupportsColor } from "@/modules/observability/lib/log-color";

const DEFAULT_ROTATION_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_ROTATED_FILES = 5;

export class GhLogger {
  private logDir: string;
  private logFile: string;
  private rotationSizeBytes: number;

  constructor(logDir?: string, rotationSizeBytes?: number) {
    this.logDir = logDir || process.env.PR_FLOW_GH_LOG_DIR || join(homedir(), ".pr-flow", "logs");
    this.logFile = join(this.logDir, "gh-commands.log");
    this.rotationSizeBytes = rotationSizeBytes || DEFAULT_ROTATION_SIZE;
  }

  logCommand(
    command: string,
    args: string[],
    exitCode: number,
    stdout: string,
    stderr: string,
    duration: number
  ): void {
    const entry = {
      timestamp: new Date().toISOString(),
      command,
      args,
      exitCode,
      stdout,
      stderr,
      duration
    };

    try {
      if (!existsSync(this.logDir)) {
        mkdirSync(this.logDir, { recursive: true });
      }

      const json = JSON.stringify(entry) + "\n";
      writeFileSync(this.logFile, json, { flag: "a" });

      // Check if rotation is needed
      this.rotateIfNeeded();

      if (this.shouldLogToConsole()) {
        this.logToConsole(command, args, exitCode, stderr, duration);
      }
    } catch (error) {
      console.warn(`[WARN] Failed to write to log file: ${error}`);
    }
  }

  private shouldLogToConsole(): boolean {
    if (process.env.LOG_FORMAT?.toLowerCase() === "json") {
      return false;
    }
    if (process.env.NODE_ENV === "production") {
      return false;
    }
    return true;
  }

  private logToConsole(
    command: string,
    args: string[],
    exitCode: number,
    stderr: string,
    duration: number
  ): void {
    const now = new Date();
    const timeStr = now.toLocaleTimeString("en-US", { hour12: false });
    const enabled = stdoutSupportsColor();

    // Truncate long args for display
    const argsStr = args.join(" ");
    const displayArgs = argsStr.length > 50 ? argsStr.substring(0, 50) + "..." : argsStr;

    const status = colorize(
      exitCode === 0 ? "✓" : "✗",
      exitCode === 0 ? logAnsi.green : logAnsi.boldRed,
      enabled
    );
    const durationStr = (duration / 1000).toFixed(1);

    let output = [
      colorize(`[${timeStr}]`, logAnsi.dim, enabled),
      colorize(`${command} ${displayArgs}`, logAnsi.cyan, enabled),
      status,
      colorize(`${durationStr}s`, logAnsi.dim, enabled)
    ].join(" ");

    if (exitCode !== 0 && stderr) {
      const stderrPreview = stderr.substring(0, 50);
      output += ` ${colorize(`(exit ${exitCode}: ${stderrPreview})`, logAnsi.boldRed, enabled)}`;
    }

    console.log(output);
  }

  private rotateIfNeeded(): void {
    try {
      if (!existsSync(this.logFile)) {
        return;
      }

      const stats = statSync(this.logFile);
      if (stats.size <= this.rotationSizeBytes) {
        return;
      }

      // Rotate: .log.4 -> delete, .log.3 -> .log.4, etc.
      for (let i = MAX_ROTATED_FILES - 1; i >= 1; i--) {
        const oldFile = i === 1 ? this.logFile : join(this.logDir, `gh-commands.log.${i}`);
        const newFile = join(this.logDir, `gh-commands.log.${i + 1}`);

        if (existsSync(oldFile)) {
          if (existsSync(newFile)) {
            unlinkSync(newFile);
          }
          renameSync(oldFile, newFile);
        }
      }

      // Rename current log to .log.1
      if (existsSync(this.logFile)) {
        const backupFile = join(this.logDir, "gh-commands.log.1");
        if (existsSync(backupFile)) {
          unlinkSync(backupFile);
        }
        renameSync(this.logFile, backupFile);
      }
    } catch (error) {
      console.warn(`[WARN] Failed to rotate log file: ${error}`);
    }
  }

  validateLogDirectory(): void {
    try {
      if (!existsSync(this.logDir)) {
        mkdirSync(this.logDir, { recursive: true });
      }
      // Try writing a test file to verify permissions
      const testFile = join(this.logDir, ".test-write");
      writeFileSync(testFile, "");
      unlinkSync(testFile);
    } catch (error) {
      throw new Error(`Log directory not writable: ${this.logDir}`);
    }
  }
}

// Singleton instance
export const ghLogger = new GhLogger();
