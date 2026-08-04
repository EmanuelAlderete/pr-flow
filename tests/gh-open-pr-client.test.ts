import { describe, expect, it, vi } from "vitest";
import { createPullRequest, fetchBranchDiff, isBranchFullyMergedInto } from "@/modules/prs/lib/open-pr/gh-open-pr-client";

describe("createPullRequest", () => {
  it("auto-atribui a PR ao usuario autenticado via @me", async () => {
    const run = vi.fn().mockResolvedValue({
      stdout: "https://github.com/acme/repo/pull/42\n",
      stderr: "",
      exitCode: 0
    });

    await createPullRequest(
      {
        repository: "acme/repo",
        branch: "feature/x",
        baseBranch: "master",
        title: "JOR-1 - X",
        body: "corpo",
        reviewers: ["rev1"]
      },
      run
    );

    expect(run).toHaveBeenCalledWith(
      expect.arrayContaining(["--assignee", "@me", "--reviewer", "rev1"])
    );
  });
});

describe("fetchBranchDiff", () => {
  it("codifica slashes no compare ref da API do GitHub", async () => {
    const run = vi.fn().mockResolvedValue({
      stdout: "diff content",
      stderr: "",
      exitCode: 0
    });

    await fetchBranchDiff("acme/repo", "chore/JOR-251/remove-routes-and-files", "main", run);

    expect(run).toHaveBeenCalledWith([
      "api",
      "/repos/acme/repo/compare/main...chore%2FJOR-251%2Fremove-routes-and-files",
      "-H",
      "Accept: application/vnd.github.v3.diff"
    ]);
  });

  it("inclui stderr do gh na mensagem de erro", async () => {
    const run = vi.fn().mockResolvedValue({
      stdout: "",
      stderr: "gh: Not Found (HTTP 404)",
      exitCode: 1
    });

    await expect(
      fetchBranchDiff("acme/repo", "chore/JOR-251/x", "main", run)
    ).rejects.toThrow("gh: Not Found (HTTP 404)");
  });
});

describe("isBranchFullyMergedInto", () => {
  it("retorna true quando ahead_by e zero", async () => {
    const run = vi.fn().mockResolvedValue({
      stdout: JSON.stringify({ status: "behind", ahead_by: 0 }),
      stderr: "",
      exitCode: 0
    });

    await expect(isBranchFullyMergedInto("acme/repo", "release/1", "master", run)).resolves.toBe(true);
  });

  it("retorna false quando compare falha", async () => {
    const run = vi.fn().mockResolvedValue({
      stdout: "",
      stderr: "404",
      exitCode: 1
    });

    await expect(isBranchFullyMergedInto("acme/repo", "release/1", "master", run)).resolves.toBe(false);
  });
});
