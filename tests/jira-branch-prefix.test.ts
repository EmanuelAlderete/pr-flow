import { describe, expect, it } from "vitest";
import {
  buildTicketBranchName,
  resolveBranchPrefixFromIssueType
} from "@/modules/jira-branch/lib/jira-branch-prefix";

describe("resolveBranchPrefixFromIssueType", () => {
  it("maps Bug to fix/", () => {
    expect(resolveBranchPrefixFromIssueType("Bug")).toBe("fix");
    expect(resolveBranchPrefixFromIssueType("bug")).toBe("fix");
  });

  it("maps other types to feat/", () => {
    expect(resolveBranchPrefixFromIssueType("Story")).toBe("feat");
    expect(resolveBranchPrefixFromIssueType("Task")).toBe("feat");
  });
});

describe("buildTicketBranchName", () => {
  it("builds feat/jor-123/slug", () => {
    expect(buildTicketBranchName("feat", "JOR-123", "add-login")).toBe("feat/jor-123/add-login");
  });
});
