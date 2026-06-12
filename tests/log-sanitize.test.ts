import { describe, expect, it } from "vitest";
import { redactDiffLikeMessage, sanitizeErrorForLog } from "@/modules/observability/lib/log-sanitize";

describe("log-sanitize", () => {
  it("redige mensagens com diff git", () => {
    expect(redactDiffLikeMessage("diff --git a/foo b/foo\n-deleted")).toBe(
      "Conteúdo de diff omitido do log — verifique open-pr:generate-body"
    );
  });

  it("trunca mensagens longas sem diff", () => {
    const message = "x".repeat(500);
    expect(redactDiffLikeMessage(message)).toMatch(/… \[truncated\]$/);
  });

  it("sanitiza Error com mensagem enorme", () => {
    const error = new Error(`diff --git a/foo b/foo\n${"y".repeat(10_000)}`);
    expect(sanitizeErrorForLog(error)).toEqual({
      name: "Error",
      message: "Conteúdo de diff omitido do log — verifique open-pr:generate-body"
    });
  });
});
