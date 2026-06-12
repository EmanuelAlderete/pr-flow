import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { readFileSync, rmSync, writeFileSync } from "node:fs";
import { mkdtempSync, chmodSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { GhLogger } from "@/modules/prs/lib/gh-logger";

describe("GhLogger", () => {
  let tempDir: string;
  let logger: GhLogger;

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), "gh-logger-"));
    logger = new GhLogger(tempDir);
  });

  afterEach(() => {
    rmSync(tempDir, { recursive: true, force: true });
  });

  it("should write a single log entry to file in correct JSON format", () => {
    logger.logCommand("gh", ["auth", "status"], 0, "", "", 123);

    const logFile = join(tempDir, "gh-commands.log");
    const content = readFileSync(logFile, "utf-8");
    const logEntry = JSON.parse(content.trim());

    expect(logEntry).toMatchObject({
      command: "gh",
      args: ["auth", "status"],
      exitCode: 0,
      stdout: "",
      stderr: "",
      duration: 123
    });
    expect(logEntry.timestamp).toBeDefined();
    expect(typeof logEntry.timestamp).toBe("string");
  });

  it("should gracefully degrade if runtime write fails", () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    // Make log directory read-only to trigger write error
    chmodSync(tempDir, 0o444);

    // Should not throw, app continues
    expect(() => {
      logger.logCommand("gh", ["api", "user"], 1, "output", "error", 500);
    }).not.toThrow();

    // Should have warned to console
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringMatching(/\[WARN\] Failed to write to log file/)
    );

    warnSpy.mockRestore();
    chmodSync(tempDir, 0o755); // Restore permissions for cleanup
  });

  it("should throw if log directory is not writable at startup", () => {
    // Create a nested temp directory and make it read-only
    const { mkdirSync } = require("node:fs");
    const readOnlyDir = join(tempDir, "readonly");
    mkdirSync(readOnlyDir, { recursive: true });
    chmodSync(readOnlyDir, 0o444);

    const readOnlyLogger = new GhLogger(readOnlyDir);

    expect(() => {
      readOnlyLogger.validateLogDirectory();
    }).toThrow(/Log directory not writable/);

    chmodSync(readOnlyDir, 0o755); // Restore for cleanup
  });

  it("should rotate log file when it exceeds size threshold", () => {
    const { readdirSync, statSync } = require("node:fs");
    
    // Create logger with small 500-byte threshold for testing
    const testLogger = new GhLogger(tempDir, 500);

    // Write entries until rotation happens
    for (let i = 0; i < 10; i++) {
      testLogger.logCommand(
        "gh",
        ["api", "graphql", "-f", `query${i}=${"x".repeat(50)}`],
        0,
        "output",
        "",
        i * 100
      );
    }

    // Check that files were rotated
    const files = readdirSync(tempDir).filter((f: string) => f.startsWith("gh-commands"));
    expect(files.length).toBeGreaterThan(1);

    // Check that rotated files have correct naming: .log, .log.1, .log.2, etc.
    const logPatterns = files.map((f: string) => f.match(/gh-commands\.log(\.\d+)?$/));
    expect(logPatterns.every((p: any) => p)).toBe(true);

    // Verify original log file exists (current writes go here)
    expect(files).toContain("gh-commands.log");
  });

  it("should output human-readable log to console", () => {
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});

    // Successful command
    logger.logCommand("gh", ["auth", "status"], 0, "", "", 123);
    expect(logSpy).toHaveBeenCalledWith(
      expect.stringMatching(/\[\d{2}:\d{2}:\d{2}\] gh auth status ✓ 0.1s/)
    );

    // Failed command with error
    logger.logCommand("gh", ["api", "user"], 1, "output", "not authenticated", 500);
    expect(logSpy).toHaveBeenCalledWith(
      expect.stringMatching(/\[\d{2}:\d{2}:\d{2}\] gh api user ✗ 0.5s \(exit 1:/)
    );

    logSpy.mockRestore();
  });

  it("should not log to console when LOG_FORMAT=json", () => {
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    const previous = process.env.LOG_FORMAT;
    process.env.LOG_FORMAT = "json";

    logger.logCommand("gh", ["auth", "status"], 0, "", "", 123);

    expect(logSpy).not.toHaveBeenCalled();

    logSpy.mockRestore();
    if (previous === undefined) {
      delete process.env.LOG_FORMAT;
    } else {
      process.env.LOG_FORMAT = previous;
    }
  });
});
