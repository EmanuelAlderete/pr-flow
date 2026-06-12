import { fireEvent, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { PrCard } from "@/modules/prs/components/pr-card";
import type { MonitoredPr } from "@/modules/prs/lib/domain";
import { renderWithProviders } from "@/tests/render-with-providers";

const samplePr: MonitoredPr = {
  id: "PR_1",
  number: 7,
  title: "fix: simplify retries",
  url: "https://github.com/acme/a/pull/7",
  repository: "acme/a",
  createdAt: "2026-05-28T10:00:00Z",
  avaliou: ["ana"],
  naoAvaliou: ["bruno"],
  semReviewersSolicitados: false,
  aprovou: ["ana"],
  solicitouAlteracoes: [],
  pendente: ["bruno"],
  requestedReviewersCount: 2,
  statusGeral: "pending_review"
};

describe("PrCard", () => {
  it("exibe tempo aberto ao lado do badge da PR", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-05-28T12:00:10Z"));
    renderWithProviders(<PrCard pr={samplePr} />);
    expect(screen.getByText("aberta há 2 horas")).toBeInTheDocument();
    vi.useRealTimers();
  });

  it("usa barra vermelha quando a revisao estiver pendente", () => {
    const { container } = renderWithProviders(<PrCard pr={samplePr} />);
    expect(container.querySelector(".pr-card")).toHaveClass("status-changes");
    expect(container.querySelector(".pr-card")).not.toHaveClass("status-pending");
  });

  it("exibe listas de revisao sem badge de pendencia", () => {
    renderWithProviders(<PrCard pr={{ ...samplePr, createdAt: "2026-05-28T10:00:00Z" }} />);
    expect(screen.queryByText("peding")).not.toBeInTheDocument();
    expect(screen.getByText("Quem falta revisar")).toBeInTheDocument();
    expect(screen.getByText("ana")).toBeInTheDocument();
    expect(screen.getByLabelText("1 revisão pendente")).toBeInTheDocument();
  });

  it("mostra pin verde para quem revisou e vermelho para quem falta", () => {
    const { container } = renderWithProviders(<PrCard pr={samplePr} />);
    const reviewedPin = container.querySelector(".reviewer-status-pin--reviewed");
    const pendingPin = container.querySelector(".reviewer-status-pin--pending");
    expect(reviewedPin).toBeInTheDocument();
    expect(pendingPin).toBeInTheDocument();
    expect(reviewedPin?.parentElement).toHaveTextContent("ana");
    expect(pendingPin?.parentElement).toHaveTextContent("bruno");
  });

  it("renderiza icones de impedimento sempre com estilo vermelho", () => {
    renderWithProviders(
      <PrCard
        pr={{
          ...samplePr,
          hasConflicts: true,
          hasUnresolvedComments: true,
          statusGeral: "approved",
          pendente: [],
          naoAvaliou: [],
          avaliou: ["ana", "bruno", "carla"],
          aprovou: ["ana", "bruno", "carla"],
          requestedReviewersCount: 3
        }}
      />
    );
    const icons = document.querySelectorAll(".pr-alert-icon");
    expect(icons.length).toBeGreaterThan(0);
    for (const icon of icons) {
      expect(icon).toHaveClass("danger");
      expect(icon).not.toHaveClass("warning");
      expect(icon).not.toHaveClass("success");
    }
  });

  it("exibe icones de alerta quando houver conflito e comentarios nao resolvidos", () => {
    renderWithProviders(<PrCard pr={{ ...samplePr, hasConflicts: true, hasUnresolvedComments: true }} />);
    expect(screen.getByLabelText("Conflitos detectados")).toBeInTheDocument();
    expect(screen.getByLabelText("Comentários não resolvidos")).toBeInTheDocument();
  });

  it("mantem barra verde e icone de aprovacoes suficientes quando houver conflito com maioria aprovada", () => {
    const { container } = renderWithProviders(
      <PrCard
        pr={{
          ...samplePr,
          hasConflicts: true,
          statusGeral: "approved",
          readyToMerge: false,
          pendente: [],
          naoAvaliou: [],
          avaliou: ["ana", "bruno", "carla"],
          aprovou: ["ana", "bruno", "carla"],
          requestedReviewersCount: 3
        }}
      />
    );
    expect(container.querySelector(".pr-card")).toHaveClass("status-approved");
    expect(screen.queryByText("approved")).not.toBeInTheDocument();
    expect(screen.getByLabelText("Já possui aprovações suficientes")).toBeInTheDocument();
    expect(screen.getByLabelText("Conflitos detectados")).toBeInTheDocument();
  });

  it("usa barra vermelha no card quando houver conflito sem maioria aprovada", () => {
    const { container } = renderWithProviders(
      <PrCard
        pr={{
          ...samplePr,
          hasConflicts: true,
          statusGeral: "pending_review"
        }}
      />
    );
    expect(container.querySelector(".pr-card")).toHaveClass("status-changes");
  });

  it("abre GitHub ao clicar no numero da PR e contexto de trabalho no titulo quando houver JOR", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        issueKey: "JOR-1234",
        jira: {
          summary: {
            key: "JOR-1234",
            summary: "Ajuste no monitor",
            statusName: "Em progresso",
            statusCategoryKey: "indeterminate",
            issueTypeName: "Story",
            priorityName: null,
            updated: "2026-05-28T10:00:00.000Z",
            browseUrl: "https://jusfy.atlassian.net/browse/JOR-1234"
          },
          detail: null
        },
        pullRequests: [],
        tasks: [],
        journalMentions: [],
        gaps: []
      })
    });
    vi.stubGlobal("fetch", fetchMock);

    renderWithProviders(
      <PrCard
        pr={{
          ...samplePr,
          title: "JOR-1234 Ajuste no monitor",
          url: "https://github.com/acme/a/pull/7"
        }}
      />
    );

    const prBadgeLink = screen.getByRole("link", { name: "Abrir PR #7 no GitHub" });
    expect(prBadgeLink).toHaveAttribute("href", "https://github.com/acme/a/pull/7");

    expect(screen.queryByRole("link", { name: /abrir jor-1234 no jira/i })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /ver contexto de trabalho de jor-1234/i }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith("/api/work-context/JOR-1234");
    });

    expect(await screen.findByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText("Ajuste no monitor")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Abrir JOR-1234 no Jira" })).toHaveAttribute(
      "href",
      "https://jusfy.atlassian.net/browse/JOR-1234"
    );

    vi.unstubAllGlobals();
  });

  it("mantem link do GitHub no titulo quando nao houver chave JOR", () => {
    renderWithProviders(<PrCard pr={samplePr} />);
    expect(screen.getByRole("link", { name: "Abrir titulo da PR no GitHub" })).toHaveAttribute(
      "href",
      "https://github.com/acme/a/pull/7"
    );
  });

  it("renderiza menu de contexto com copiar mensagem e enviar ao Slack", async () => {
    renderWithProviders(<PrCard pr={samplePr} />);

    expect(screen.queryByLabelText(/abrir pr no github/i)).not.toBeInTheDocument();
    expect(screen.queryByRole("menuitem", { name: "Copiar mensagem da PR" })).not.toBeInTheDocument();

    fireEvent.contextMenu(document.querySelector(".pr-card")!);

    expect(await screen.findByRole("menuitem", { name: "Copiar mensagem da PR" })).toBeInTheDocument();
    expect(screen.getByRole("menuitem", { name: "Enviar ao Slack" })).toHaveAttribute("aria-disabled", "true");
  });

  it("omite copiar mensagem no menu quando o Slack esta configurado", async () => {
    renderWithProviders(<PrCard pr={samplePr} slackConfigured />);

    fireEvent.contextMenu(document.querySelector(".pr-card")!);

    expect(await screen.findByRole("menuitem", { name: "Enviar ao Slack" })).toBeInTheDocument();
    expect(screen.queryByRole("menuitem", { name: "Copiar mensagem da PR" })).not.toBeInTheDocument();
  });

  it("habilita envio ao Slack quando o titulo tem chave Jira", async () => {
    renderWithProviders(
      <PrCard pr={{ ...samplePr, title: "JOR-99 Ajuste", url: "https://github.com/acme/a/pull/7" }} />
    );

    fireEvent.contextMenu(document.querySelector(".pr-card")!);

    expect(await screen.findByRole("menuitem", { name: "Enviar ao Slack" })).not.toHaveAttribute(
      "aria-disabled",
      "true"
    );
  });

  it("copia mensagem da PR para o clipboard ao escolher no menu de contexto", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal("navigator", { clipboard: { writeText } });

    renderWithProviders(<PrCard pr={{ ...samplePr, title: "JOR-99 Ajuste", url: "https://github.com/acme/a/pull/7" }} />);

    fireEvent.contextMenu(document.querySelector(".pr-card")!);
    fireEvent.click(await screen.findByRole("menuitem", { name: "Copiar mensagem da PR" }));

    expect(writeText).toHaveBeenCalledWith(
      "JOR-99 Ajuste: https://jusfy.atlassian.net/browse/JOR-99\n\n- https://github.com/acme/a/pull/7"
    );

    vi.unstubAllGlobals();
  });

  it("abre dialogo de selecao quando ha varias PRs com o mesmo ticket Jira", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const sharedPrs: MonitoredPr[] = [
      {
        ...samplePr,
        id: "PR_1",
        number: 7,
        title: "JOR-99 API",
        url: "https://github.com/acme/api/pull/7",
        repository: "acme/api"
      },
      {
        ...samplePr,
        id: "PR_2",
        number: 3,
        title: "JOR-99 Web",
        url: "https://github.com/acme/web/pull/3",
        repository: "acme/web"
      }
    ];

    renderWithProviders(<PrCard allOpenPrs={sharedPrs} pr={sharedPrs[0]} />);

    fireEvent.contextMenu(document.querySelector(".pr-card")!);
    fireEvent.click(await screen.findByRole("menuitem", { name: "Enviar ao Slack" }));

    expect(await screen.findByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText(/prs abertas com jor-99/i)).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();

    vi.unstubAllGlobals();
  });

  it("envia PR ao Slack ao escolher no menu de contexto", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        ok: true,
        threadTs: "1234.5678",
        slackShare: {
          sharedAt: "2026-05-28T12:00:00.000Z",
          channel: "squad-jornada-pr"
        }
      })
    });
    vi.stubGlobal("fetch", fetchMock);

    renderWithProviders(
      <PrCard pr={{ ...samplePr, title: "JOR-99 Ajuste", url: "https://github.com/acme/a/pull/7" }} />
    );

    fireEvent.contextMenu(document.querySelector(".pr-card")!);
    fireEvent.click(await screen.findByRole("menuitem", { name: "Enviar ao Slack" }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith("/api/prs/slack-share", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: "JOR-99 Ajuste",
          url: "https://github.com/acme/a/pull/7",
          prId: "PR_1",
          selectedPrUrls: ["https://github.com/acme/a/pull/7"],
          prRecords: [{ url: "https://github.com/acme/a/pull/7", prId: "PR_1" }]
        })
      });
    });

    vi.unstubAllGlobals();
  });

  it("exibe icone de Slack quando a PR ja foi enviada", () => {
    renderWithProviders(
      <PrCard
        pr={{
          ...samplePr,
          title: "JOR-99 Ajuste",
          slackShare: {
            sharedAt: "2026-05-28T12:00:00.000Z",
            channel: "squad-jornada-pr"
          }
        }}
      />
    );

    expect(screen.getByLabelText(/enviada ao slack/i)).toBeInTheDocument();
  });

  it("pede confirmacao antes de reenviar ao Slack", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        ok: true,
        threadTs: "9999.0000",
        slackShare: {
          sharedAt: "2026-05-28T13:00:00.000Z",
          channel: "squad-jornada-pr"
        }
      })
    });
    vi.stubGlobal("fetch", fetchMock);

    renderWithProviders(
      <PrCard
        pr={{
          ...samplePr,
          title: "JOR-99 Ajuste",
          url: "https://github.com/acme/a/pull/7",
          slackShare: {
            sharedAt: "2026-05-28T12:00:00.000Z",
            channel: "squad-jornada-pr"
          }
        }}
      />
    );

    fireEvent.contextMenu(document.querySelector(".pr-card")!);
    fireEvent.click(await screen.findByRole("menuitem", { name: "Reenviar ao Slack" }));

    expect(await screen.findByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText(/esta pr já foi encaminhada ao canal/i)).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: "Enviar novamente" }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalled();
    });

    vi.unstubAllGlobals();
  });

  it("mostra indicador para pr sem reviewers solicitados", () => {
    renderWithProviders(
      <PrCard
        pr={{
          ...samplePr,
          semReviewersSolicitados: true,
          avaliou: [],
          naoAvaliou: [],
          aprovou: [],
          solicitouAlteracoes: [],
          pendente: [],
          statusGeral: "no_reviewers"
        }}
      />
    );
    expect(screen.getByText("0 reviewers solicitados")).toBeInTheDocument();
  });
});
