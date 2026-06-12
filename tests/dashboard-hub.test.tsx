import { render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { DashboardHub } from "@/modules/dashboard/components/dashboard-hub";
import { clearDashboardHubStatsCache } from "@/modules/dashboard/lib/dashboard-widget-cache";

describe("DashboardHub", () => {
  afterEach(() => {
    clearDashboardHubStatsCache();
    vi.unstubAllGlobals();
  });

  it("renders module shortcuts and loads stats", async () => {
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
            json: async () => ({ status: "ok", data: [{ id: "1" }, { id: "2" }] })
          });
        }
        if (url.includes("/api/tasks")) {
          return Promise.resolve({
            ok: true,
            json: async () => ({
              open: [{ id: "t1", title: "A", isOverdue: true }],
              completed: []
            })
          });
        }
        if (url.includes("/api/jira/sprints")) {
          return Promise.resolve({
            ok: true,
            json: async () => ({
              sprints: [
                { id: 7, name: "Sprint atual", state: "active", startDate: null, endDate: null }
              ]
            })
          });
        }
        if (url.includes("/api/jira/issues")) {
          return Promise.resolve({
            ok: true,
            json: async () => ({
              issues: [{ key: "JOR-1" }, { key: "JOR-2" }]
            })
          });
        }
        return Promise.resolve({ ok: false });
      })
    );

    render(<DashboardHub />);

    expect(screen.getByRole("link", { name: /pull requests/i })).toHaveAttribute("href", "/prs");
    expect(screen.getByRole("link", { name: /tarefas/i })).toHaveAttribute("href", "/tasks");
    expect(screen.getByRole("link", { name: /jira/i })).toHaveAttribute("href", "/jira");

    await waitFor(() =>
      expect(screen.getByRole("status", { name: /2 abertas, 2 para revisar/i })).toBeInTheDocument()
    );
    expect(screen.getByRole("link", { name: /2 para revisar/i })).toHaveAttribute("href", "/prs/reviews");
    expect(screen.getByRole("status", { name: /1 em aberto, 1 atrasada/i })).toBeInTheDocument();
    expect(
      screen.getByRole("status", { name: /2 tickets na sprint, sprint atual/i })
    ).toBeInTheDocument();
  });

  it("exibe sub-stat de revisões pendentes com link para a fila", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn((input: RequestInfo) => {
        const url = String(input);
        if (url.includes("/api/prs/reviewer-queue")) {
          return Promise.resolve({
            ok: true,
            json: async () => ({
              status: "ok",
              data: [{ id: "1", myReviewStatus: "pending" }],
              fetchedAt: "2026-05-29T12:00:00.000Z",
              githubLogin: "dev"
            })
          });
        }
        if (url.endsWith("/api/prs") || url.includes("/api/prs?")) {
          return Promise.resolve({
            ok: true,
            json: async () => ({ status: "ok", data: [{ id: "1" }] })
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

    render(<DashboardHub />);

    await waitFor(() =>
      expect(screen.getByRole("status", { name: /1 aberta, 1 para revisar/i })).toBeInTheDocument()
    );
    expect(screen.getByRole("link", { name: /1 para revisar/i })).toHaveAttribute("href", "/prs/reviews");
  });

  it("mostra stats do cache imediatamente enquanto atualiza em segundo plano", async () => {
    const { saveDashboardHubStatsCache } = await import(
      "@/modules/dashboard/lib/dashboard-widget-cache"
    );
    saveDashboardHubStatsCache({
      openPrs: 9,
      openTasks: 3,
      overdueTasks: 0,
      pendingReviews: 0,
      jiraSprintTickets: 5,
      jiraSprintLabel: "Sprint cache"
    });

    vi.stubGlobal(
      "fetch",
      vi.fn(() => new Promise(() => {}))
    );

    render(<DashboardHub />);

    await waitFor(() =>
      expect(screen.getByRole("status", { name: /9 abertas/i })).toBeInTheDocument()
    );
    expect(screen.getByRole("status", { name: /3 em aberto/i })).toBeInTheDocument();
    expect(
      screen.getByRole("status", { name: /5 tickets na sprint, sprint cache/i })
    ).toBeInTheDocument();
  });
});
