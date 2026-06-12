import { beforeEach, describe, expect, it, vi } from "vitest";

const loadJiraIssueDetail = vi.fn();

vi.mock("@/modules/jira/lib/jira-cache-repository", () => ({
  loadJiraIssueDetail: (...args: unknown[]) => loadJiraIssueDetail(...args)
}));

import {
  enrichOpenPrBranchItemsFromAssigned,
  resolveSuggestedTitleForBranch
} from "@/modules/prs/lib/open-pr/open-pr-branch-enrichment";

describe("open-pr-branch-enrichment", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("usa summary do ticket sem consultar cache Jira", async () => {
    const result = await resolveSuggestedTitleForBranch("feat/JOR-9/x", "JOR-9", "Bug fix");

    expect(result).toEqual({
      issueKey: "JOR-9",
      suggestedTitle: "JOR-9 - Bug fix",
      jiraSummary: "Bug fix"
    });
    expect(loadJiraIssueDetail).not.toHaveBeenCalled();
  });

  it("enriquece branches atribuidas de forma sincrona", () => {
    const branches = enrichOpenPrBranchItemsFromAssigned([
      { branchName: "feat/JOR-9/x", issueKey: "JOR-9", issueSummary: "Bug fix" }
    ]);

    expect(branches).toEqual([
      {
        name: "feat/JOR-9/x",
        issueKey: "JOR-9",
        suggestedTitle: "JOR-9 - Bug fix",
        jiraSummary: "Bug fix"
      }
    ]);
  });
});
