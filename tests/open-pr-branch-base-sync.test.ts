import { describe, expect, it, vi } from "vitest";

const isBranchFullyMergedInto = vi.fn();
const listOpenPrBranchBasesForRepository = vi.fn();
const updateOpenPrBranchBaseTargets = vi.fn();
const listMonitoredRepositoriesForApp = vi.fn();
const writeSystemLogFireAndForget = vi.fn();

vi.mock("@/modules/prs/lib/open-pr/gh-open-pr-client", () => ({
  isBranchFullyMergedInto: (...args: unknown[]) => isBranchFullyMergedInto(...args)
}));

vi.mock("@/modules/prs/lib/open-pr/open-pr-branch-base-repository", () => ({
  listOpenPrBranchBasesForRepository: (...args: unknown[]) =>
    listOpenPrBranchBasesForRepository(...args),
  updateOpenPrBranchBaseTargets: (...args: unknown[]) => updateOpenPrBranchBaseTargets(...args)
}));

vi.mock("@/modules/prs/lib/monitored-repositories-service", () => ({
  listMonitoredRepositoriesForApp: (...args: unknown[]) => listMonitoredRepositoriesForApp(...args)
}));

vi.mock("@/modules/observability/lib/system-logger", () => ({
  writeSystemLogFireAndForget: (...args: unknown[]) => writeSystemLogFireAndForget(...args)
}));

import { syncOpenPrBranchBaseRedirects } from "@/modules/prs/lib/open-pr/open-pr-branch-base-sync";

describe("syncOpenPrBranchBaseRedirects", () => {
  it("ignora quando nao ha repositorios monitorados", async () => {
    listMonitoredRepositoriesForApp.mockResolvedValue([]);

    const result = await syncOpenPrBranchBaseRedirects();

    expect(result.status).toBe("skipped");
    expect(listOpenPrBranchBasesForRepository).not.toHaveBeenCalled();
  });

  it("aplica redirecionamentos persistidos no banco", async () => {
    listMonitoredRepositoriesForApp.mockResolvedValue([
      {
        id: "1",
        repository: "acme/repo",
        defaultBranch: "master",
        sortOrder: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]);
    listOpenPrBranchBasesForRepository.mockResolvedValue([
      {
        id: "r1",
        repository: "acme/repo",
        branchName: "feat/a",
        baseBranch: "release/1",
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]);
    isBranchFullyMergedInto.mockResolvedValue(true);
    updateOpenPrBranchBaseTargets.mockResolvedValue(1);

    const result = await syncOpenPrBranchBaseRedirects();

    expect(result.updatedCount).toBe(1);
    expect(updateOpenPrBranchBaseTargets).toHaveBeenCalledWith("acme/repo", "release/1", "master");
    expect(writeSystemLogFireAndForget).toHaveBeenCalledWith(
      expect.objectContaining({
        source: "open-pr:branch-base-sync"
      })
    );
  });
});
