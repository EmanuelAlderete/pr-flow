import { describe, expect, it, vi } from "vitest";
import { syncPrCache } from "@/modules/prs/lib/pr-sync-service";

const writeSystemLogFireAndForget = vi.fn();

vi.mock("@/modules/observability/lib/system-logger", () => ({
  writeSystemLogFireAndForget: (...args: unknown[]) => writeSystemLogFireAndForget(...args)
}));

const savePrCaches = vi.fn().mockResolvedValue(undefined);
const savePrSyncMeta = vi.fn().mockResolvedValue(undefined);
const getPrSyncMeta = vi.fn().mockResolvedValue(null);
const loadPrMonitorCache = vi.fn().mockResolvedValue(null);
const loadPrReviewContextCache = vi.fn().mockResolvedValue(null);
const insertPrTimelineEvents = vi.fn().mockResolvedValue(0);

vi.mock("@/modules/prs/lib/pr-cache-repository", () => ({
  savePrCaches: (...args: unknown[]) => savePrCaches(...args),
  savePrSyncMeta: (...args: unknown[]) => savePrSyncMeta(...args),
  getPrSyncMeta: (...args: unknown[]) => getPrSyncMeta(...args),
  loadPrMonitorCache: (...args: unknown[]) => loadPrMonitorCache(...args),
  loadPrReviewContextCache: (...args: unknown[]) => loadPrReviewContextCache(...args)
}));

vi.mock("@/modules/prs/lib/pr-timeline-repository", () => ({
  insertPrTimelineEvents: (...args: unknown[]) => insertPrTimelineEvents(...args)
}));

vi.mock("@/modules/prs/lib/open-pr/open-pr-branch-base-sync", () => ({
  syncOpenPrBranchBaseRedirects: vi.fn().mockResolvedValue({
    status: "ok",
    repositoriesChecked: 0,
    updatedCount: 0
  })
}));

vi.mock("@/modules/prs/lib/monitored-repositories-service", () => ({
  getMonitoredRepositorySlugsForSync: vi.fn()
}));

vi.mock("@/modules/prs/lib/pr-sync-data-service", () => ({
  getPrSyncData: vi.fn(),
  toMonitorApiResponse: vi.fn((result: { monitor: unknown[]; fetchedAt: string; githubLogin: string }) => ({
    status: "ok" as const,
    data: result.monitor,
    fetchedAt: result.fetchedAt,
    githubLogin: result.githubLogin
  }))
}));

import { getMonitoredRepositorySlugsForSync } from "@/modules/prs/lib/monitored-repositories-service";
import { getPrSyncData } from "@/modules/prs/lib/pr-sync-data-service";

describe("syncPrCache", () => {
  it("pula quando repositorios nao estao configurados", async () => {
    vi.mocked(getMonitoredRepositorySlugsForSync).mockResolvedValue([]);
    const result = await syncPrCache();
    expect(result.status).toBe("skipped");
    expect(savePrCaches).not.toHaveBeenCalled();
  });

  it("persiste cache em sync com sucesso", async () => {
    vi.mocked(getPrSyncData).mockResolvedValue({
      status: "ok",
      githubLogin: "rigon",
      fetchedAt: "2026-05-28T12:00:00Z",
      monitor: [],
      reviewerQueue: [],
      reviewContext: []
    });

    vi.mocked(getMonitoredRepositorySlugsForSync).mockResolvedValue(["acme/a"]);
    const result = await syncPrCache();
    expect(result.status).toBe("ok");
    expect(savePrCaches).toHaveBeenCalledWith({
      monitor: [],
      reviewerQueue: [],
      reviewContext: [],
      githubLogin: "rigon"
    });
    expect(insertPrTimelineEvents).toHaveBeenCalled();
  });

  it("registra meta de erro quando gh falha", async () => {
    vi.mocked(getPrSyncMeta).mockResolvedValue({
      id: "default",
      githubLogin: "rigon",
      lastSyncedAt: new Date(),
      lastSyncStatus: "ok",
      lastSyncError: null
    });
    vi.mocked(getPrSyncData).mockResolvedValue({
      status: "error",
      message: "gh quebrou"
    });

    vi.mocked(getMonitoredRepositorySlugsForSync).mockResolvedValue(["acme/a"]);
    const result = await syncPrCache();
    expect(result.status).toBe("error");
    expect(savePrSyncMeta).toHaveBeenCalledWith({
      githubLogin: "rigon",
      status: "error",
      error: "gh quebrou"
    });
    expect(writeSystemLogFireAndForget).toHaveBeenCalledWith(
      expect.objectContaining({
        level: "error",
        source: "prs:sync",
        message: "gh quebrou"
      })
    );
  });
});
