import { beforeEach, describe, expect, it, vi } from "vitest";
import type { MonitoredPr } from "@/modules/prs/lib/domain";

const hasPrCache = vi.fn();
const loadPrMonitorCache = vi.fn();

vi.mock("@/modules/prs/lib/pr-cache-repository", () => ({
  hasPrCache: (...args: unknown[]) => hasPrCache(...args),
  loadPrMonitorCache: (...args: unknown[]) => loadPrMonitorCache(...args)
}));

const samplePr = (id: string, title: string): MonitoredPr => ({
  id,
  number: 1,
  title,
  url: "https://github.com/acme/repo/pull/1",
  repository: "acme/repo",
  createdAt: "2026-05-28T10:00:00.000Z",
  avaliou: [],
  naoAvaliou: [],
  semReviewersSolicitados: false,
  aprovou: [],
  solicitouAlteracoes: [],
  pendente: [],
  requestedReviewersCount: 0,
  statusGeral: "pending_review"
});

describe("loadWorkContextPullRequests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("retorna PRs do cache cujo titulo menciona a chave", async () => {
    hasPrCache.mockResolvedValue(true);
    loadPrMonitorCache.mockResolvedValue({
      githubLogin: "rigon",
      fetchedAt: "2026-05-28T20:00:00.000Z",
      data: [samplePr("pr-1", "JOR-123 Feature"), samplePr("pr-2", "Outro titulo")]
    });

    const { loadWorkContextPullRequests } = await import(
      "@/modules/work-context/lib/work-context-pull-requests"
    );
    const prs = await loadWorkContextPullRequests("jor-123");

    expect(prs).toHaveLength(1);
    expect(prs[0]?.number).toBe(1);
    expect(prs[0]?.title).toBe("JOR-123 Feature");
  });

  it("retorna vazio quando nao ha cache de PR", async () => {
    hasPrCache.mockResolvedValue(false);

    const { loadWorkContextPullRequests } = await import(
      "@/modules/work-context/lib/work-context-pull-requests"
    );
    const prs = await loadWorkContextPullRequests("JOR-123");

    expect(prs).toEqual([]);
    expect(loadPrMonitorCache).not.toHaveBeenCalled();
  });
});
