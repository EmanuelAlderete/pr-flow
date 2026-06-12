import { describe, expect, it } from "vitest";
import {
  sanitizeDiffForLlm,
  summarizeDiffForLlm
} from "@/modules/prs/lib/open-pr/open-pr-diff-sanitizer";

describe("summarizeDiffForLlm", () => {
  it("resume remoções binárias sem sintaxe de diff", () => {
    const diff = `diff --git a/public/media/error/bg2.jpg b/public/media/error/bg2.jpg
deleted file mode 100755
index 48c0ff9be7..0000000000
Binary files a/public/media/error/bg2.jpg and /dev/null differ
diff --git a/public/media/error/bg3.jpg b/public/media/error/bg3.jpg
deleted file mode 100755
index 9ebc925875..0000000000
Binary files a/public/media/error/bg3.jpg and /dev/null differ`;

    const summary = summarizeDiffForLlm(diff);

    expect(summary).toContain("Total: 2 arquivo(s)");
    expect(summary).toContain("removido (binário): public/media/error/bg2.jpg");
    expect(summary).toContain("removido (binário): public/media/error/bg3.jpg");
    expect(summary).not.toContain("diff --git");
    expect(summary).not.toContain("Binary files");
  });

  it("resume hunks grandes com contagem de linhas", () => {
    const removedLines = Array.from({ length: 50 }, (_, index) => `-line ${index}`).join("\n");
    const diff = `diff --git a/src/icon.svg b/src/icon.svg
deleted file mode 100644
index abc..000
--- a/src/icon.svg
+++ /dev/null
${removedLines}`;

    const summary = summarizeDiffForLlm(diff);

    expect(summary).toContain("removido: src/icon.svg");
    expect(summary).toContain("−50");
    expect(summary).not.toContain("-line 0");
  });
});

describe("sanitizeDiffForLlm", () => {
  it("resume hunks binários", () => {
    const diff = `diff --git a/public/bg.jpg b/public/bg.jpg
deleted file mode 100755
index abc123..0000000
Binary files a/public/bg.jpg and /dev/null differ`;

    const sanitized = sanitizeDiffForLlm(diff);

    expect(sanitized).toContain("arquivo binário");
    expect(sanitized).not.toContain("Binary files");
  });

  it("mantém hunks pequenos intactos", () => {
    const diff = `diff --git a/src/a.ts b/src/a.ts
index 111..222 100644
--- a/src/a.ts
+++ b/src/a.ts
@@ -1,2 +1,2 @@
-old
+new`;

    expect(sanitizeDiffForLlm(diff)).toBe(diff);
  });
});
