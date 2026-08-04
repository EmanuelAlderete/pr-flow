import { describe, expect, it } from "vitest";
import { normalizeLlmBranchSlug, validateBranchSlug } from "@/modules/jira-branch/lib/jira-branch-slug";

describe("validateBranchSlug", () => {
  it("accepts kebab-case slug", () => {
    expect(validateBranchSlug("add-login-endpoint")).toBeNull();
  });

  it("rejects empty slug", () => {
    expect(validateBranchSlug("")).toMatch(/obrigatório/i);
  });

  it("rejects invalid characters", () => {
    expect(validateBranchSlug("Add_Login")).toMatch(/minúsculas/i);
  });
});

describe("normalizeLlmBranchSlug", () => {
  it("normalizes LLM output to kebab-case", () => {
    expect(normalizeLlmBranchSlug("Add Login Endpoint")).toBe("add-login-endpoint");
    expect(normalizeLlmBranchSlug('"fix-bug"')).toBe("fix-bug");
  });
});
