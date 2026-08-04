import { beforeEach, describe, expect, it, vi } from "vitest";

const remoteBranchExists = vi.fn();
const getRemoteBranchSha = vi.fn();
const createRemoteBranch = vi.fn();
const loadJiraBranchNamingContext = vi.fn();
const getMonitoredRepositoryBySlug = vi.fn();
const ensureMonitoredRepositoriesReady = vi.fn();

vi.mock("@/modules/jira-branch/lib/gh-branch-client", () => ({
  remoteBranchExists: (...args: unknown[]) => remoteBranchExists(...args),
  getRemoteBranchSha: (...args: unknown[]) => getRemoteBranchSha(...args),
  createRemoteBranch: (...args: unknown[]) => createRemoteBranch(...args)
}));

vi.mock("@/modules/jira-branch/lib/jira-branch-context", () => ({
  loadJiraBranchNamingContext: (...args: unknown[]) => loadJiraBranchNamingContext(...args)
}));

vi.mock("@/modules/prs/lib/monitored-repository-repository", () => ({
  getMonitoredRepositoryBySlug: (...args: unknown[]) => getMonitoredRepositoryBySlug(...args)
}));

vi.mock("@/modules/prs/lib/monitored-repositories-service", () => ({
  ensureMonitoredRepositoriesReady: (...args: unknown[]) => ensureMonitoredRepositoriesReady(...args)
}));

vi.mock("@/modules/observability/lib/system-logger", () => ({
  writeSystemLogFireAndForget: vi.fn()
}));

describe("createJiraBranches", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    ensureMonitoredRepositoriesReady.mockResolvedValue(undefined);
    loadJiraBranchNamingContext.mockResolvedValue({
      issueKey: "JOR-9",
      summary: "Fix login",
      issueTypeName: "Story",
      description: null,
      comments: []
    });
    getMonitoredRepositoryBySlug.mockResolvedValue({
      repository: "acme/api",
      defaultBranch: "main"
    });
    remoteBranchExists.mockResolvedValue(false);
    getRemoteBranchSha.mockResolvedValue("sha-base");
    createRemoteBranch.mockResolvedValue(undefined);
  });

  it("creates branch in monitored repository", async () => {
    const { createJiraBranches } = await import("@/modules/jira-branch/lib/jira-branch-service");

    const result = await createJiraBranches("JOR-9", {
      slug: "add-login",
      targets: [{ repository: "acme/api", baseBranch: "main" }]
    });

    expect(result.status).toBe("ok");
    if (result.status !== "ok") {
      return;
    }

    expect(result.branchName).toBe("feat/jor-9/add-login");
    expect(createRemoteBranch).toHaveBeenCalledWith(
      "acme/api",
      "feat/jor-9/add-login",
      "sha-base",
      undefined
    );
    expect(result.results[0]?.status).toBe("created");
    expect(result.results[0]?.openPrUrl).toContain("/prs/open?");
  });

  it("skips when branch already exists", async () => {
    remoteBranchExists.mockResolvedValue(true);

    const { createJiraBranches } = await import("@/modules/jira-branch/lib/jira-branch-service");

    const result = await createJiraBranches("JOR-9", {
      slug: "add-login",
      targets: [{ repository: "acme/api", baseBranch: "main" }]
    });

    expect(result.status).toBe("ok");
    if (result.status !== "ok") {
      return;
    }

    expect(createRemoteBranch).not.toHaveBeenCalled();
    expect(result.results[0]?.status).toBe("skipped");
  });
});
