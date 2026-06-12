import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { DashboardPage } from "@/modules/dashboard/components/dashboard-page";
import {
  clearDashboardBriefingCache,
  saveDashboardBriefingCache
} from "@/modules/dashboard/lib/dashboard-widget-cache";
import { todayLocalDateString } from "@/modules/journal/lib/notebook-day";

vi.mock("@/modules/dashboard/components/dashboard-hub", () => ({
  DashboardHub: () => null
}));

vi.mock("@/modules/dashboard/components/dashboard-tasks-widget", () => ({
  DashboardTasksWidget: () => null
}));

describe("DashboardPage briefing", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
    sessionStorage.clear();
  });

  afterEach(() => {
    clearDashboardBriefingCache(todayLocalDateString());
    sessionStorage.clear();
    vi.unstubAllGlobals();
  });

  it("mostra briefing do cache sem estado de carregamento inicial", async () => {
    const day = todayLocalDateString();
    saveDashboardBriefingCache(day, {
      status: "ok",
      day,
      previousBusinessDay: "2026-05-29",
      summary: "## Do cache\n- Item",
      generatedAt: "2026-05-28T10:00:00.000Z"
    });

    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => ({
        status: "ok",
        day,
        previousBusinessDay: "2026-05-29",
        summary: "## Do cache\n- Item",
        generatedAt: "2026-05-28T10:00:00.000Z"
      })
    } as Response);

    render(<DashboardPage />);

    await waitFor(() => {
      expect(screen.getByTestId("dashboard-briefing")).toBeInTheDocument();
    });
    expect(screen.queryByText(/carregando briefing/i)).not.toBeInTheDocument();
  });

  it("carrega briefing persistido ao montar", async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => ({
        status: "ok",
        day: "2026-06-01",
        previousBusinessDay: "2026-05-29",
        summary: "## Projeção para hoje\n- Revisar PRs",
        generatedAt: "2026-06-01T12:00:00.000Z"
      })
    } as Response);

    render(<DashboardPage />);

    await waitFor(() => {
      expect(screen.getByTestId("dashboard-briefing")).toBeInTheDocument();
    });
    expect(screen.getByRole("button", { name: /atualizar briefing/i })).toBeInTheDocument();
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining("/api/dashboard/briefing?day="),
      expect.objectContaining({ cache: "no-store" })
    );
  });

  it("mostra estado de espera quando briefing ainda não foi gerado", async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => ({
        status: "not_generated",
        day: "2026-06-01",
        previousBusinessDay: "2026-05-29"
      })
    } as Response);

    render(<DashboardPage />);

    await waitFor(() => {
      expect(screen.getByText(/rotina automática roda a cada hora/i)).toBeInTheDocument();
    });
  });

  it("recarrega briefing ao clicar em Atualizar", async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => ({
        status: "ok",
        day: "2026-06-01",
        previousBusinessDay: "2026-05-29",
        summary: "## Motivação\nSeguimos.",
        generatedAt: "2026-06-01T12:00:00.000Z"
      })
    } as Response);

    render(<DashboardPage />);

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /atualizar briefing/i })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: /atualizar briefing/i }));

    await waitFor(() => {
      expect(vi.mocked(fetch).mock.calls.length).toBeGreaterThanOrEqual(2);
    });
  });

  it("shows message when API key is missing", async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: false,
      status: 503,
      json: async () => ({
        status: "missing_api_key",
        message: "Configure GEMINI_API_KEY no .env para gerar o briefing do dash."
      })
    } as Response);

    render(<DashboardPage />);

    await waitFor(() => {
      expect(screen.getByText(/configure gemini_api_key/i)).toBeInTheDocument();
    });
  });

  it("shows message when there is no input", async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: false,
      status: 422,
      json: async () => ({
        status: "no_input",
        day: "2026-06-01",
        message: "Não há dados suficientes para o briefing."
      })
    } as Response);

    render(<DashboardPage />);

    await waitFor(() => {
      expect(screen.getByTestId("dashboard-briefing-no-input")).toBeInTheDocument();
    });
  });

  it("shows friendly message when rate limited", async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: false,
      status: 429,
      json: async () => ({
        status: "rate_limited",
        message: "O limite de uso da API Gemini foi atingido."
      })
    } as Response);

    render(<DashboardPage />);

    await waitFor(() => {
      expect(screen.getByTestId("dashboard-briefing-rate-limited")).toBeInTheDocument();
    });
    expect(screen.getByRole("link", { name: /gerenciar limite/i })).toHaveAttribute(
      "href",
      "https://ai.studio/spend"
    );
  });
});
