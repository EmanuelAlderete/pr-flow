import { afterEach, describe, expect, it, vi } from "vitest";
import { fetchDashboardHubStats } from "@/modules/dashboard/lib/dashboard-hub-stats";

describe("fetchDashboardHubStats", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("agrega PRs, tasks e tickets da sprint ativa no Jira", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn((input: RequestInfo) => {
        const url = String(input);
        if (url.includes("/api/prs")) {
          return Promise.resolve({
            ok: true,
            json: async () => ({ status: "ok", data: [{ id: "1" }] })
          });
        }
        if (url.includes("/api/tasks")) {
          return Promise.resolve({
            ok: true,
            json: async () => ({
              open: [{ id: "t1", title: "A", isOverdue: false }],
              completed: []
            })
          });
        }
        if (url.includes("/api/jira/sprints")) {
          return Promise.resolve({
            ok: true,
            json: async () => ({
              sprints: [
                { id: 42, name: "Sprint 12", state: "active", startDate: null, endDate: null }
              ]
            })
          });
        }
        if (url.includes("/api/jira/issues")) {
          return Promise.resolve({
            ok: true,
            json: async () => ({
              issues: [{ key: "JOR-1" }, { key: "JOR-2" }, { key: "JOR-3" }]
            })
          });
        }
        return Promise.resolve({ ok: false });
      })
    );

    const stats = await fetchDashboardHubStats();

    expect(stats.openPrs).toBe(1);
    expect(stats.openTasks).toBe(1);
    expect(stats.jiraSprintTickets).toBe(3);
    expect(stats.jiraSprintLabel).toBe("Sprint 12");
    expect(String(vi.mocked(fetch).mock.calls.find(([url]) => String(url).includes("/api/jira/issues"))?.[0])).toContain(
      "sprint=42"
    );
  });

  it("conta PRs pendentes de revisão na fila do revisor", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn((input: RequestInfo) => {
        const url = String(input);
        if (url.includes("/api/prs/reviewer-queue")) {
          return Promise.resolve({
            ok: true,
            json: async () => ({
              status: "ok",
              data: [
                { id: "1", myReviewStatus: "pending" },
                { id: "2", myReviewStatus: "pending" },
                { id: "3", myReviewStatus: "reviewed" }
              ],
              fetchedAt: "2026-05-29T12:00:00.000Z",
              githubLogin: "dev"
            })
          });
        }
        if (url.includes("/api/prs")) {
          return Promise.resolve({
            ok: true,
            json: async () => ({ status: "ok", data: [] })
          });
        }
        if (url.includes("/api/tasks")) {
          return Promise.resolve({
            ok: true,
            json: async () => ({ open: [], completed: [] })
          });
        }
        if (url.includes("/api/jira/sprints")) {
          return Promise.resolve({ ok: false });
        }
        return Promise.resolve({ ok: false });
      })
    );

    const stats = await fetchDashboardHubStats();

    expect(stats.pendingReviews).toBe(2);
  });
});
