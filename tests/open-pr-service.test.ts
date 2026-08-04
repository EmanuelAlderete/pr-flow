import { beforeEach, describe, expect, it, vi } from "vitest";

const discoverOpenPrBranches = vi.fn();
const createPullRequest = vi.fn();
const runPrSyncCron = vi.fn();
const upsertOpenPrBranchBase = vi.fn();
const getOpenPrBranchBaseMap = vi.fn();
const listDistinctOpenPrBaseBranchesForRepository = vi.fn();
const listAuthorBranches = vi.fn();

vi.mock("@/modules/prs/lib/open-pr/open-pr-branch-discovery", () => ({
  discoverOpenPrBranches: (...args: unknown[]) => discoverOpenPrBranches(...args)
}));

vi.mock("@/modules/prs/lib/open-pr/gh-open-pr-client", () => ({
  getGhAuthenticatedLogin: vi.fn().mockResolvedValue("dev"),
  createPullRequest: (...args: unknown[]) => createPullRequest(...args),
  listAuthorBranches: (...args: unknown[]) => listAuthorBranches(...args)
}));

vi.mock("@/modules/prs/lib/open-pr/open-pr-branch-base-repository", () => ({
  upsertOpenPrBranchBase: (...args: unknown[]) => upsertOpenPrBranchBase(...args),
  getOpenPrBranchBaseMap: (...args: unknown[]) => getOpenPrBranchBaseMap(...args),
  listDistinctOpenPrBaseBranchesForRepository: (...args: unknown[]) =>
    listDistinctOpenPrBaseBranchesForRepository(...args)
}));

const listMonitoredRepositoriesForApp = vi.fn();
const ensureMonitoredRepositoriesReady = vi.fn().mockResolvedValue(undefined);
const getMonitoredRepositoryBySlug = vi.fn();

vi.mock("@/modules/prs/lib/monitored-repositories-service", () => ({
  listMonitoredRepositoriesForApp: (...args: unknown[]) => listMonitoredRepositoriesForApp(...args),
  ensureMonitoredRepositoriesReady: (...args: unknown[]) =>
    ensureMonitoredRepositoriesReady(...args),
  noMonitoredRepositoriesMessage: () => "sem repos"
}));

vi.mock("@/modules/prs/lib/monitored-repository-repository", () => ({
  getMonitoredRepositoryBySlug: (...args: unknown[]) => getMonitoredRepositoryBySlug(...args)
}));

vi.mock("@/modules/devtools/lib/cron-job-runners", () => ({
  runPrSyncCron: (...args: unknown[]) => runPrSyncCron(...args)
}));

const writeSystemLogFireAndForget = vi.fn();

vi.mock("@/modules/observability/lib/system-logger", () => ({
  writeSystemLogFireAndForget: (...args: unknown[]) => writeSystemLogFireAndForget(...args)
}));

import {
  createOpenPullRequest,
  listOpenPrBranches,
  listOpenPrRepositories
} from "@/modules/prs/lib/open-pr/open-pr-service";

describe("open-pr-service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getOpenPrBranchBaseMap.mockResolvedValue(new Map());
    upsertOpenPrBranchBase.mockResolvedValue(undefined);
    discoverOpenPrBranches.mockResolvedValue({
      status: "ok",
      branches: [],
      githubLogin: "dev",
      branchSource: "github"
    });
    runPrSyncCron.mockResolvedValue({
      jobId: "cron:prs-sync",
      status: "ok",
      message: "Sincronização concluída (1 PRs)."
    });
  });

  it("lista repositorios do banco", async () => {
    listMonitoredRepositoriesForApp.mockResolvedValue([
      { id: "1", repository: "acme/a", defaultBranch: "main", sortOrder: 0, createdAt: new Date(), updatedAt: new Date() },
      { id: "2", repository: "acme/b", defaultBranch: "master", sortOrder: 1, createdAt: new Date(), updatedAt: new Date() }
    ]);

    const result = await listOpenPrRepositories();
    expect(result.status).toBe("ok");
    if (result.status === "ok") {
      expect(result.repositories).toEqual([
        { repository: "acme/a", defaultBranch: "main" },
        { repository: "acme/b", defaultBranch: "master" }
      ]);
    }
  });

  it("delega listagem de branches ao modulo de discovery", async () => {
    discoverOpenPrBranches.mockResolvedValue({
      status: "ok",
      branches: [
        {
          name: "feat/JOR-9/x",
          issueKey: "JOR-9",
          suggestedTitle: "JOR-9 - Bug fix",
          jiraSummary: "Bug fix"
        }
      ],
      githubLogin: "dev",
      branchSource: "jira"
    });

    const result = await listOpenPrBranches("acme/repo");

    expect(discoverOpenPrBranches).toHaveBeenCalledWith("acme/repo", undefined);
    expect(result.status).toBe("ok");
    if (result.status === "ok") {
      expect(result.branchSource).toBe("jira");
      expect(result.branches[0]).toMatchObject({
        name: "feat/JOR-9/x",
        issueKey: "JOR-9"
      });
    }
  });

  it("cria pull request via gh", async () => {
    getMonitoredRepositoryBySlug.mockResolvedValue({
      id: "1",
      repository: "acme/repo",
      defaultBranch: "master",
      sortOrder: 0,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    createPullRequest.mockResolvedValue({
      url: "https://github.com/acme/repo/pull/1",
      number: 1
    });

    const result = await createOpenPullRequest({
      repository: "acme/repo",
      branch: "git_convention/jor-1/x",
      title: "JOR-1 - X",
      body: "body",
      baseBranch: "master",
      reviewers: ["pmabatista"]
    });

    expect(result.status).toBe("ok");
    expect(createPullRequest).toHaveBeenCalledWith(
      expect.objectContaining({
        repository: "acme/repo",
        reviewers: ["pmabatista"]
      }),
      undefined
    );
    expect(upsertOpenPrBranchBase).toHaveBeenCalledWith({
      repository: "acme/repo",
      branchName: "git_convention/jor-1/x",
      baseBranch: "master"
    });
    expect(runPrSyncCron).toHaveBeenCalledWith({ manual: true });
  });

  it("emite system log quando sync pos-criacao falha", async () => {
    getMonitoredRepositoryBySlug.mockResolvedValue({
      id: "1",
      repository: "acme/repo",
      defaultBranch: "master",
      sortOrder: 0,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    createPullRequest.mockResolvedValue({
      url: "https://github.com/acme/repo/pull/1",
      number: 1
    });
    runPrSyncCron.mockRejectedValue(new Error("sync falhou"));

    const result = await createOpenPullRequest({
      repository: "acme/repo",
      branch: "git_convention/jor-1/x",
      title: "JOR-1 - X",
      body: "body",
      baseBranch: "master",
      reviewers: []
    });

    expect(result.status).toBe("ok");
    expect(writeSystemLogFireAndForget).toHaveBeenCalledWith(
      expect.objectContaining({
        level: "warn",
        source: "open-pr:create",
        message: "PR criada, mas falha ao sincronizar cache de PRs."
      })
    );
  });
});
