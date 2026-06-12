import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("observability/promtail-config.yml", () => {
  const config = readFileSync(
    resolve(process.cwd(), "observability/promtail-config.yml"),
    "utf8"
  );

  it("não usa lookahead negativo (RE2 do Promtail não suporta)", () => {
    expect(config).not.toMatch(/\(\?!/);
  });

  it("filtra linhas que não são JSON de system log", () => {
    expect(config).toContain("drop_counter_reason: not_system_log");
    expect(config).toMatch(/expression:\s*'\^\[\^\{\]'/);
  });
});
