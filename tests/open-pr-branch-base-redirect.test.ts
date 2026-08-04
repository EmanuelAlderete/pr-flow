import { describe, expect, it, vi } from "vitest";
import { redirectMergedOpenPrBranchBases } from "@/modules/prs/lib/open-pr/open-pr-branch-base-redirect";

describe("redirectMergedOpenPrBranchBases", () => {
  it("redireciona branches cuja base foi mergeada na master", async () => {
    const records = [
      { branchName: "feat/a", baseBranch: "release/1" },
      { branchName: "feat/b", baseBranch: "release/1" }
    ];
    const updateTargets = vi.fn().mockResolvedValue(2);
    const isBranchFullyMergedInto = vi.fn(async (_repo, branch, into) => {
      return branch === "release/1" && into === "master";
    });

    const result = await redirectMergedOpenPrBranchBases({
      repository: "acme/repo",
      defaultBranch: "master",
      records,
      isBranchFullyMergedInto,
      updateTargets
    });

    expect(result.updatedCount).toBe(2);
    expect(updateTargets).toHaveBeenCalledWith("release/1", "master");
    expect(records.every((record) => record.baseBranch === "master")).toBe(true);
  });

  it("propaga redirecionamento em cascata quando branch intermediaria foi mergeada", async () => {
    const records = [
      { branchName: "feat/a", baseBranch: "release/1" },
      { branchName: "feat/b", baseBranch: "feat/a" }
    ];
    const updateTargets = vi.fn().mockResolvedValueOnce(1).mockResolvedValueOnce(1);

    const isBranchFullyMergedInto = vi.fn(async (_repo, branch, into) => {
      if (branch === "release/1" && into === "master") {
        return true;
      }
      if (branch === "feat/a" && into === "master") {
        return true;
      }
      return false;
    });

    const result = await redirectMergedOpenPrBranchBases({
      repository: "acme/repo",
      defaultBranch: "master",
      records,
      isBranchFullyMergedInto,
      updateTargets
    });

    expect(result.updatedCount).toBe(2);
    expect(records.find((record) => record.branchName === "feat/a")?.baseBranch).toBe("master");
    expect(records.find((record) => record.branchName === "feat/b")?.baseBranch).toBe("master");
  });

  it("redireciona filhas para o pai quando branch intermediaria mergeia na base dela", async () => {
    const records = [
      { branchName: "feat/a", baseBranch: "release/1" },
      { branchName: "feat/b", baseBranch: "feat/a" }
    ];
    const updateTargets = vi.fn().mockResolvedValueOnce(1);

    const isBranchFullyMergedInto = vi.fn(async (_repo, branch, into) => {
      return branch === "feat/a" && into === "release/1";
    });

    const result = await redirectMergedOpenPrBranchBases({
      repository: "acme/repo",
      defaultBranch: "master",
      records,
      isBranchFullyMergedInto,
      updateTargets
    });

    expect(result.updatedCount).toBe(1);
    expect(updateTargets).toHaveBeenCalledWith("feat/a", "release/1");
    expect(records.find((record) => record.branchName === "feat/b")?.baseBranch).toBe("release/1");
  });
});
