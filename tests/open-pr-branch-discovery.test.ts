import { beforeEach, describe, expect, it, vi } from "vitest";

const getGhAuthenticatedLogin = vi.fn();
const listAuthorBranches = vi.fn();
const enrichOpenPrBranchItems = vi.fn();
const getCachedOpenPrBranches = vi.fn();
const setCachedOpenPrBranches = vi.fn();

vi.mock("@/modules/prs/lib/open-pr/open-pr-branch-cache", () => ({
  getCachedOpenPrBranches: (...args: unknown[]) => getCachedOpenPrBranches(...args),
  setCachedOpenPrBranches: (...args: unknown[]) => setCachedOpenPrBranches(...args)
}));

vi.mock("@/modules/prs/lib/open-pr/gh-open-pr-client", () => ({
  getGhAuthenticatedLogin: (...args: unknown[]) => getGhAuthenticatedLogin(...args),
  listAuthorBranches: (...args: unknown[]) => listAuthorBranches(...args)
}));

vi.mock("@/modules/prs/lib/open-pr/open-pr-branch-enrichment", () => ({
  enrichOpenPrBranchItems: (...args: unknown[]) => enrichOpenPrBranchItems(...args)
}));

import { discoverOpenPrBranches } from "@/modules/prs/lib/open-pr/open-pr-branch-discovery";

describe("discoverOpenPrBranches", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getCachedOpenPrBranches.mockReturnValue(null);
    getGhAuthenticatedLogin.mockResolvedValue("dev");
    enrichOpenPrBranchItems.mockImplementation(async (entries: Array<{ branchName: string }>) =>
      entries.map((entry) => ({
        name: entry.branchName,
        issueKey: null,
        suggestedTitle: null,
        jiraSummary: null,
        baseBranch: null
      }))
    );
  });

  it("retorna do cache sem chamar GitHub", async () => {
    getCachedOpenPrBranches.mockReturnValue({
      status: "ok",
      branches: [{ name: "feat/JOR-1/x", issueKey: "JOR-1", suggestedTitle: null, jiraSummary: null, baseBranch: null }],
      githubLogin: "dev",
      branchSource: "github"
    });

    const result = await discoverOpenPrBranches("acme/repo");

    expect(result.status).toBe("ok");
    expect(getGhAuthenticatedLogin).not.toHaveBeenCalled();
    expect(listAuthorBranches).not.toHaveBeenCalled();
  });

  it("lista branches do autor no GitHub e enriquece com Jira quando possivel", async () => {
    listAuthorBranches.mockResolvedValue([{ name: "feat/jor-9/x" }]);
    enrichOpenPrBranchItems.mockResolvedValue([
      {
        name: "feat/jor-9/x",
        issueKey: "JOR-9",
        suggestedTitle: "JOR-9 - X",
        jiraSummary: "X",
        baseBranch: null
      }
    ]);

    const result = await discoverOpenPrBranches("acme/repo");

    expect(result.status).toBe("ok");
    if (result.status === "ok") {
      expect(result.branchSource).toBe("github");
      expect(result.githubLogin).toBe("dev");
      expect(result.branches[0]?.name).toBe("feat/jor-9/x");
    }
    expect(listAuthorBranches).toHaveBeenCalledWith("acme/repo", "dev", undefined);
    expect(setCachedOpenPrBranches).toHaveBeenCalled();
  });
});
