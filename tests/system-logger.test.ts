import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

describe("system-logger", () => {
  const stdoutWrite = vi.spyOn(process.stdout, "write").mockImplementation(() => true);

  beforeEach(() => {
    vi.resetModules();
    stdoutWrite.mockClear();
    delete process.env.LOG_FORMAT;
    delete process.env.DATABASE_URL;
    process.env.NODE_ENV = "test";
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("emite JSON Lines quando LOG_FORMAT=json", async () => {
    process.env.LOG_FORMAT = "json";
    const { writeSystemLog } = await import("@/modules/observability/lib/system-logger");

    await writeSystemLog({
      level: "info",
      source: "cron:prs-sync",
      message: "ok",
      details: { count: 2 }
    });

    const line = String(stdoutWrite.mock.calls[0]?.[0]);
    const parsed = JSON.parse(line) as {
      level: string;
      source: string;
      message: string;
      details: { count: number };
      timestamp: string;
    };

    expect(parsed.level).toBe("info");
    expect(parsed.source).toBe("cron:prs-sync");
    expect(parsed.message).toBe("ok");
    expect(parsed.details).toEqual({ count: 2 });
    expect(parsed.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  it("redige diff em message quando LOG_FORMAT=json", async () => {
    process.env.LOG_FORMAT = "json";
    const { writeSystemLog } = await import("@/modules/observability/lib/system-logger");

    await writeSystemLog({
      level: "error",
      source: "open-pr:generate-body",
      message: "diff --git a/foo b/foo\n-deleted"
    });

    const line = String(stdoutWrite.mock.calls[0]?.[0]);
    const parsed = JSON.parse(line) as { message: string };
    expect(parsed.message).toBe(
      "Conteúdo de diff omitido do log — verifique open-pr:generate-body"
    );
  });

  it("emite formato legível quando LOG_FORMAT=pretty", async () => {
    process.env.LOG_FORMAT = "pretty";
    const { writeSystemLog } = await import("@/modules/observability/lib/system-logger");

    await writeSystemLog({
      level: "warn",
      source: "system",
      message: "boot"
    });

    const line = String(stdoutWrite.mock.calls[0]?.[0]);
    expect(line).toContain("warn [system] boot");
    expect(() => JSON.parse(line)).toThrow();
  });
});
