import { describe, expect, it } from "vitest";
import { looksLikeRawDiffOutput } from "@/modules/prs/lib/open-pr/open-pr-body-output";

describe("looksLikeRawDiffOutput", () => {
  it("detecta diff bruto em uma linha", () => {
    expect(
      looksLikeRawDiffOutput(
        "diff --git a/public/media/error/bg2.jpg b/public/media/error/bg2.jpg deleted file mode 100755 Binary files"
      )
    ).toBe(true);
  });

  it("detecta diff bruto multilinha", () => {
    expect(
      looksLikeRawDiffOutput(`diff --git a/foo b/foo
deleted file mode 100644`)
    ).toBe(true);
  });

  it("aceita markdown de PR", () => {
    expect(
      looksLikeRawDiffOutput(`# [JOR-251 - Feature](https://jira.example/JOR-251)

## O que mudou?
- Remove rotas não utilizadas`)
    ).toBe(false);
  });

  it("detecta bloco dominado por linhas de patch", () => {
    const patch = Array.from({ length: 12 }, () => "- removed line").join("\n");
    expect(looksLikeRawDiffOutput(patch)).toBe(true);
  });
});
