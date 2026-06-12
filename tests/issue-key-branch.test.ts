import { describe, expect, it } from "vitest";
import { extractJiraIssueKeyFromBranch } from "@/modules/jira-issue-key/lib/issue-key-branch";

describe("extractJiraIssueKeyFromBranch", () => {
  it("extrai chave do padrao git_convention/jor-123/info", () => {
    expect(extractJiraIssueKeyFromBranch("git_convention/jor-123/ajuste-fluxo")).toBe("JOR-123");
  });

  it("normaliza casing no segmento", () => {
    expect(extractJiraIssueKeyFromBranch("git_convention/JOR-99/deploy")).toBe("JOR-99");
  });

  it("retorna null sem segmento jor", () => {
    expect(extractJiraIssueKeyFromBranch("feature/minha-branch")).toBeNull();
  });
});
