import { fireEvent, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { JiraPage } from "@/modules/jira/components/jira-page";
import { renderWithProviders } from "@/tests/render-with-providers";

vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams()
}));

describe("JiraPage", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("renders the jira tickets region", () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockImplementation((url: string) => {
        if (url.includes("/api/jira/sprints")) {
          return Promise.resolve({
            ok: true,
            status: 200,
            json: async () => ({
              boardId: 1,
              boardName: "Board",
              projectKey: "JOR",
              sprints: []
            })
          });
        }
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({ email: "a@b.com", displayName: null, sprintFilter: "all", issues: [] })
        });
      })
    );

    renderWithProviders(<JiraPage />);

    expect(screen.getByRole("region", { name: /tickets do jira/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/filtrar tickets por sprint/i)).toBeInTheDocument();
  });

  it("carrega tickets da sprint ativa por padrao", async () => {
    const fetchMock = vi.fn().mockImplementation((url: string) => {
      if (url.includes("/api/jira/sprints")) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({
            boardId: 1,
            boardName: "Board",
            projectKey: "JOR",
            sprints: [
              {
                id: 4943,
                name: "Sprint 24",
                state: "active",
                startDate: "2026-05-01T00:00:00.000Z",
                endDate: "2026-05-15T00:00:00.000Z"
              }
            ]
          })
        });
      }
      return Promise.resolve({
        ok: true,
        status: 200,
        json: async () => ({
          email: "a@b.com",
          displayName: null,
          sprintFilter: "4943",
          issues: []
        })
      });
    });
    vi.stubGlobal("fetch", fetchMock);

    renderWithProviders(<JiraPage />);

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith("/api/jira/issues?sprint=4943", { cache: "no-store" });
    });
  });

  it("abre contexto de trabalho ao clicar no card", async () => {
    const fetchMock = vi.fn().mockImplementation((url: string) => {
      if (url.includes("/api/jira/sprints")) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({
            boardId: 1,
            boardName: "Board",
            projectKey: "JOR",
            sprints: [],
            cachedAt: "2026-05-29T10:00:00.000Z"
          })
        });
      }
      if (url.includes("/api/work-context/JOR-42")) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({
            issueKey: "JOR-42",
            jira: {
              summary: {
                key: "JOR-42",
                summary: "Detalhe do ticket",
                statusName: "Em progresso",
                statusCategoryKey: "indeterminate",
                issueTypeName: "Tarefa",
                priorityName: "Alta",
                updated: "2026-05-29T10:00:00.000Z",
                browseUrl: "https://jusfy.atlassian.net/browse/JOR-42"
              },
              detail: null
            },
            pullRequests: [],
            tasks: [],
            journalMentions: [],
            gaps: []
          })
        });
      }
      return Promise.resolve({
        ok: true,
        status: 200,
        json: async () => ({
          email: "a@b.com",
          displayName: "Dev",
          sprintFilter: "all",
          cachedAt: "2026-05-29T10:00:00.000Z",
          issues: [
            {
              key: "JOR-42",
              summary: "Implementar checkout",
              statusName: "Em progresso",
              statusCategoryKey: "indeterminate",
              issueTypeName: "Tarefa",
              priorityName: "Alta",
              updated: "2026-05-29T10:00:00.000Z",
              browseUrl: "https://jusfy.atlassian.net/browse/JOR-42"
            }
          ]
        })
      });
    });
    vi.stubGlobal("fetch", fetchMock);

    renderWithProviders(<JiraPage />);

    const openButton = await screen.findByRole("button", {
      name: /ver detalhes de JOR-42/i
    });
    fireEvent.click(openButton);

    await waitFor(() => {
      expect(fetchMock.mock.calls.some(([url]) => String(url).includes("/api/work-context/JOR-42"))).toBe(
        true
      );
    });
    expect(await screen.findByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText("Detalhe do ticket")).toBeInTheDocument();
  });
});
