import { describe, expect, it, vi } from "vitest";
import { getPrSyncData, toMonitorApiResponse } from "@/modules/prs/lib/pr-sync-data-service";
import { GhCommandError, GhUnauthenticatedError } from "@/modules/prs/lib/gh-client";

const saveGithubLogin = vi.fn().mockResolvedValue(undefined);

vi.mock("@/modules/app/lib/github-login-repository", () => ({
  saveGithubLogin: (...args: unknown[]) => saveGithubLogin(...args)
}));

describe("getPrSyncData", () => {
  it("persiste githubLogin no banco apos sync com sucesso", async () => {
    const collector = vi.fn().mockResolvedValue({
      githubLogin: "rigon",
      prs: []
    });
    await getPrSyncData(collector, { repositories: ["acme/a"] });
    expect(saveGithubLogin).toHaveBeenCalledWith("rigon");
  });

  it("retorna erro quando repositorios nao estao configurados", async () => {
    const result = await getPrSyncData(vi.fn(), { repositories: [] });
    expect(result.status).toBe("error");
  });

  it("retorna estado unauthenticated quando gh nao autenticado", async () => {
    const collector = vi.fn().mockRejectedValue(new GhUnauthenticatedError("x"));
    const result = await getPrSyncData(collector, { repositories: ["acme/a"] });
    expect(result.status).toBe("unauthenticated");
  });

  it("retorna dados agregados em caso de sucesso", async () => {
    const collector = vi.fn().mockResolvedValue({
      githubLogin: "rigon",
      prs: [
        {
          id: "PR_1",
          number: 3,
          title: "feat",
          url: "https://github.com/acme/a/pull/3",
          repository: "acme/a",
          createdAt: "2026-05-28T10:00:00Z",
          authorLogin: "rigon",
          requestedReviewers: ["ana"],
          reviews: [{ login: "ana", state: "COMMENTED", submittedAt: "2026-05-28T10:00:00Z" }]
        }
      ]
    });
    const syncResult = await getPrSyncData(collector, { repositories: ["acme/a"] });
    expect(syncResult.status).toBe("ok");
    if (syncResult.status !== "ok") return;

    const result = toMonitorApiResponse(syncResult);
    expect(result.status).toBe("ok");
    if (result.status === "ok") {
      expect(result.githubLogin).toBe("rigon");
      expect(result.data[0].avaliou).toEqual(["ana"]);
    }
  });

  it("retorna erro amigavel em falha de subprocesso", async () => {
    const collector = vi.fn().mockRejectedValue(new GhCommandError("gh quebrou"));
    const result = await getPrSyncData(collector, { repositories: ["acme/a"] });
    expect(result.status).toBe("error");
    if (result.status === "error") {
      expect(result.message).toContain("gh quebrou");
    }
  });

  it("prioriza prs ready to merge no topo", async () => {
    const collector = vi.fn().mockResolvedValue({
      githubLogin: "rigon",
      prs: [
        {
          id: "PR_1",
          number: 1,
          title: "normal",
          url: "https://github.com/acme/a/pull/1",
          repository: "acme/a",
          createdAt: "2026-05-28T10:00:00Z",
          authorLogin: "rigon",
          requestedReviewers: ["ana", "bruno", "carla"],
          reviews: []
        },
        {
          id: "PR_2",
          number: 2,
          title: "ready",
          url: "https://github.com/acme/a/pull/2",
          repository: "acme/a",
          createdAt: "2026-05-28T10:00:00Z",
          authorLogin: "rigon",
          requestedReviewers: ["ana", "bruno", "carla"],
          reviews: [
            { login: "ana", state: "APPROVED", submittedAt: "2026-05-28T10:00:00Z" },
            { login: "bruno", state: "COMMENTED", submittedAt: "2026-05-28T10:01:00Z" }
          ],
          hasConflicts: false,
          hasUnresolvedComments: false
        }
      ]
    });

    const syncResult = await getPrSyncData(collector, { repositories: ["acme/a"] });
    expect(syncResult.status).toBe("ok");
    if (syncResult.status !== "ok") return;

    const result = toMonitorApiResponse(syncResult);
    expect(result.status).toBe("ok");
    if (result.status === "ok") {
      expect(result.data[0].id).toBe("PR_2");
      expect(result.data[0].readyToMerge).toBe(true);
    }
  });
});
