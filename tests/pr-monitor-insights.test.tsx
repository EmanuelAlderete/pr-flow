import { screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { PrMonitorPage } from "@/modules/prs/components/pr-monitor-page";
import type { PrApiResponse } from "@/modules/prs/lib/domain";
import { clearPrMonitorLastSync, savePrMonitorLastSync } from "@/modules/prs/lib/pr-monitor-cache";
import { savePrReviewerQueueLastSync } from "@/modules/prs/lib/pr-reviewer-queue-cache";
import { renderWithProviders } from "@/tests/render-with-providers";

vi.mock("@/modules/prs/hooks/use-weather-forecast", () => ({
  useWeatherForecast: () => ({ status: "error", forecast: null })
}));

function mockFetchSequence(...responses: PrApiResponse[]) {
  const fetchMock = vi.fn();
  for (const response of responses) {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => response
    });
  }
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

describe("PrMonitorPage insights", () => {
  afterEach(() => {
    clearPrMonitorLastSync();
    window.localStorage.clear();
    vi.unstubAllGlobals();
  });

  it("shows insights panel with metrics from cached PR data", async () => {
    savePrReviewerQueueLastSync({
      status: "ok",
      fetchedAt: "2026-05-29T12:00:00Z",
      githubLogin: "rigon",
      data: [
        {
          id: "PR_Q1",
          number: 9,
          title: "review me",
          url: "https://github.com/acme/a/pull/9",
          repository: "acme/a",
          myReviewStatus: "pending"
        }
      ]
    });

    mockFetchSequence({
      status: "ok",
      fetchedAt: "2026-05-29T12:00:00Z",
      githubLogin: "rigon",
      data: [
        {
          id: "PR_1",
          number: 1,
          title: "feat antiga",
          url: "https://github.com/acme/a/pull/1",
          repository: "acme/a",
          createdAt: "2026-05-20T10:00:00Z",
          avaliou: [],
          naoAvaliou: ["ana"],
          semReviewersSolicitados: false,
          aprovou: [],
          solicitouAlteracoes: [],
          pendente: ["ana"],
          requestedReviewersCount: 1,
          statusGeral: "pending_review"
        },
        {
          id: "PR_2",
          number: 2,
          title: "feat recente",
          url: "https://github.com/acme/a/pull/2",
          repository: "acme/a",
          createdAt: "2026-05-28T10:00:00Z",
          avaliou: ["bob"],
          naoAvaliou: [],
          semReviewersSolicitados: false,
          aprovou: ["bob"],
          solicitouAlteracoes: [],
          pendente: [],
          requestedReviewersCount: 1,
          statusGeral: "approved"
        }
      ]
    });

    renderWithProviders(<PrMonitorPage />);

    await waitFor(() => {
      expect(screen.getByRole("region", { name: "Insights de PRs" })).toBeInTheDocument();
    });
    expect(screen.getByText(/PRs esfriando/i)).toBeInTheDocument();
    expect(screen.getByText(/Pendentes na fila/i)).toBeInTheDocument();
  });
});
