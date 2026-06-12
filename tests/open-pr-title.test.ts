import { describe, expect, it } from "vitest";
import { buildOpenPrTitle, resolveIssueKeyForBranch } from "@/modules/prs/lib/open-pr/open-pr-title";

describe("open-pr title", () => {
  it("monta titulo com summary do Jira", () => {
    expect(buildOpenPrTitle("JOR-42", "Ajuste no checkout")).toBe("JOR-42 - Ajuste no checkout");
  });

  it("resolve issue key da branch", () => {
    expect(resolveIssueKeyForBranch("git_convention/jor-7/deploy")).toBe("JOR-7");
  });
});
