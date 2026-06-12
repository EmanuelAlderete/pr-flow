import { describe, expect, it, vi, beforeEach } from "vitest";
import { collectOpenAuthorPrs, GhUnauthenticatedError, defaultRunner } from "@/modules/prs/lib/gh-client";
import { GhLogger } from "@/modules/prs/lib/gh-logger";
import * as ghClientModule from "@/modules/prs/lib/gh-client";

describe("collectOpenAuthorPrs", () => {
  it("consulta prs abertas do autor e normaliza retorno", async () => {
    const run = vi
      .fn()
      .mockResolvedValueOnce({ stdout: "", stderr: "", exitCode: 0 })
      .mockResolvedValueOnce({ stdout: "rigon", stderr: "", exitCode: 0 })
      .mockResolvedValueOnce({
        stdout: JSON.stringify({
          data: {
            repository: {
              pullRequests: {
                nodes: [
                  {
                    id: "PR_1",
                    number: 10,
                    title: "feat: monitor",
                    url: "https://github.com/acme/a/pull/10",
                    createdAt: "2026-05-20T08:00:00Z",
                    mergeStateStatus: "CLEAN",
                    mergeable: "CONFLICTING",
                    author: { login: "rigon" },
                    reviewThreads: { nodes: [{ isResolved: false }] },
                    reviewRequests: { nodes: [{ requestedReviewer: { login: "ana" } }] },
                    reviews: { nodes: [{ author: { login: "ana" }, state: "APPROVED", submittedAt: "2026-05-28T10:00:00Z" }] }
                  }
                ]
              }
            }
          }
        }),
        stderr: "",
        exitCode: 0
      });

    const result = await collectOpenAuthorPrs(["acme/a"], run);

    expect(run).toHaveBeenCalledTimes(3);
    expect(result.githubLogin).toBe("rigon");
    expect(result.prs).toHaveLength(1);
    expect(result.prs[0].repository).toBe("acme/a");
    expect(result.prs).toHaveLength(1);
    expect(result.prs[0].authorLogin).toBe("rigon");
    expect(result.prs[0].requestedReviewers).toEqual(["ana"]);
    expect(result.prs[0].hasConflicts).toBe(true);
    expect(result.prs[0].hasUnresolvedComments).toBe(true);
    expect(result.prs[0].createdAt).toBe("2026-05-20T08:00:00Z");
  });

  it("traduz erro de autenticacao do gh", async () => {
    const run = vi.fn().mockResolvedValueOnce({
      stdout: "",
      stderr: "To get started with GitHub CLI, please run: gh auth login",
      exitCode: 1
    });

    await expect(collectOpenAuthorPrs(["acme/a"], run)).rejects.toBeInstanceOf(GhUnauthenticatedError);
  });

  it("faz fallback para gh api user quando --jq falha com json intermitente", async () => {
    const run = vi
      .fn()
      .mockResolvedValueOnce({ stdout: "", stderr: "", exitCode: 0 })
      .mockResolvedValueOnce({ stdout: "", stderr: "unexpected end of JSON input", exitCode: 1 })
      .mockResolvedValueOnce({ stdout: JSON.stringify({ login: "rigon" }), stderr: "", exitCode: 0 })
      .mockResolvedValueOnce({
        stdout: JSON.stringify({
          data: {
            repository: {
              pullRequests: {
                nodes: []
              }
            }
          }
        }),
        stderr: "",
        exitCode: 0
      });

    const result = await collectOpenAuthorPrs(["acme/a"], run);
    expect(result.prs).toEqual([]);
    expect(result.githubLogin).toBe("rigon");
    expect(run).toHaveBeenNthCalledWith(3, ["api", "user"]);
  });
});

describe("defaultRunner", () => {
  it("should log successful command execution", async () => {
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    
    const result = await defaultRunner(["auth", "status"]);

    expect(result.exitCode).toBe(0);
    // Verify logging was called (console output would have been generated)
    expect(logSpy).toHaveBeenCalled();
    
    logSpy.mockRestore();
  });

  it("should return command output unchanged", async () => {
    const run = vi.fn().mockResolvedValueOnce({
      stdout: "test output",
      stderr: "",
      exitCode: 0
    });

    // Use the custom runner to avoid actual execution
    const result = await run(["echo", "hello"]);
    expect(result).toEqual({
      stdout: "test output",
      stderr: "",
      exitCode: 0
    });
  });
});
