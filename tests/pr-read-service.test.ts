import { describe, expect, it, vi } from "vitest";
import { getMonitorFromCache } from "@/modules/prs/lib/pr-read-service";

vi.mock("@/modules/prs/lib/pr-cache-repository", () => ({
  getPrSyncMeta: vi.fn(),
  loadPrMonitorCache: vi.fn(),
  loadPrMonitorCacheAllowStale: vi.fn()
}));

vi.mock("@/modules/prs/lib/pr-slack-share-repository", () => ({
  getPrSlackSharesByUrls: vi.fn().mockResolvedValue(new Map())
}));

vi.mock("@/modules/prs/lib/local-review/local-review-repository", () => ({
  getLatestLocalReviewsByPullRequest: vi.fn().mockResolvedValue(new Map())
}));

import {
  getPrSyncMeta,
  loadPrMonitorCache,
  loadPrMonitorCacheAllowStale
} from "@/modules/prs/lib/pr-cache-repository";

describe("getMonitorFromCache", () => {
  it("retorna estado unauthenticated da meta", async () => {
    vi.mocked(getPrSyncMeta).mockResolvedValue({
      id: "default",
      githubLogin: null,
      lastSyncedAt: new Date(),
      lastSyncStatus: "unauthenticated",
      lastSyncError: "sem token"
    });
    vi.mocked(loadPrMonitorCacheAllowStale).mockResolvedValue(null);

    const result = await getMonitorFromCache();
    expect(result).toEqual({ status: "unauthenticated", message: "sem token" });
  });

  it("retorna dados do cache quando disponivel", async () => {
    vi.mocked(getPrSyncMeta).mockResolvedValue({
      id: "default",
      githubLogin: "rigon",
      lastSyncedAt: new Date(),
      lastSyncStatus: "ok",
      lastSyncError: null
    });
    vi.mocked(loadPrMonitorCache).mockResolvedValue({
      data: [],
      fetchedAt: "2026-05-28T12:00:00Z",
      githubLogin: "rigon"
    });

    const result = await getMonitorFromCache();
    expect(result.status).toBe("ok");
  });

  it("retorna dados desatualizados quando a sincronizacao falhou mas ha cache", async () => {
    vi.mocked(getPrSyncMeta).mockResolvedValue({
      id: "default",
      githubLogin: "rigon",
      lastSyncedAt: new Date(),
      lastSyncStatus: "error",
      lastSyncError: "GitHub fora do ar"
    });
    vi.mocked(loadPrMonitorCacheAllowStale).mockResolvedValue({
      data: [
        {
          id: "PR_1",
          number: 1,
          title: "feat",
          url: "https://github.com/acme/a/pull/1",
          repository: "acme/a",
          createdAt: "2026-05-28T10:00:00Z",
          avaliou: [],
          naoAvaliou: ["ana"],
          semReviewersSolicitados: false,
          aprovou: [],
          solicitouAlteracoes: [],
          pendente: ["ana"],
          statusGeral: "pending_review"
        }
      ],
      fetchedAt: "2026-05-28T11:00:00Z",
      githubLogin: "rigon"
    });

    const result = await getMonitorFromCache();
    expect(result).toMatchObject({
      status: "stale",
      message: "GitHub fora do ar",
      githubLogin: "rigon"
    });
  });
});
