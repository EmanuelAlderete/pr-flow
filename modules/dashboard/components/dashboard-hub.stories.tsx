import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import type { JiraIssueDto, JiraIssuesResponse, JiraSprintsResponse } from "@/modules/jira/lib/domain";
import { clearDashboardHubStatsCache } from "@/modules/dashboard/lib/dashboard-widget-cache";
import type { PrApiSuccess, ReviewerQueueApiSuccess } from "@/modules/prs/lib/domain";
import type { OpenTaskDto, TaskListResponse } from "@/modules/tasks/lib/domain";
import { shiftNotebookDay, todayLocalDateString } from "@/modules/journal/lib/notebook-day";

import { DashboardHub } from "./dashboard-hub";

const fetchedAt = "2026-10-16T12:00:00.000Z";

const sprintsResponse: JiraSprintsResponse = {
  boardId: 12,
  boardName: "Engenharia",
  projectKey: "JUS",
  sprints: [
    {
      id: 42,
      name: "Sprint 42",
      state: "active",
      startDate: "2026-10-06T00:00:00.000Z",
      endDate: "2026-10-17T00:00:00.000Z"
    }
  ],
  cachedAt: fetchedAt
};

function jiraIssue(key: string, summary: string): JiraIssueDto {
  return {
    key,
    summary,
    statusName: "Em andamento",
    statusCategoryKey: "indeterminate",
    issueTypeName: "Tarefa",
    priorityName: "Alta",
    updated: fetchedAt,
    browseUrl: `https://jira.example/browse/${key}`
  };
}

function issuesResponse(issues: JiraIssueDto[]): JiraIssuesResponse {
  return {
    email: "dev@example.com",
    displayName: null,
    sprintFilter: "42",
    issues,
    cachedAt: fetchedAt
  };
}

function openTask(id: string, title: string, dueDate: string | null, isOverdue: boolean): OpenTaskDto {
  return {
    id,
    title,
    description: null,
    dueDate,
    completedAt: null,
    createdAt: "2026-10-10T12:00:00.000Z",
    updatedAt: fetchedAt,
    isOverdue
  };
}

function tasksResponse(open: OpenTaskDto[]): TaskListResponse {
  return { open, completed: [] };
}

function prsResponse(count: number): PrApiSuccess {
  return {
    status: "ok",
    fetchedAt,
    githubLogin: "dev",
    data: Array.from({ length: count }, (_, index) => {
      const number = 410 + index;
      return {
        id: `pr-${number}`,
        number,
        title: ["Corrigir filtro da sprint", "Ajustar contagem de férias", "Documentar atalhos", "Atualizar o briefing"][index] ?? `PR ${number}`,
        url: `https://github.com/jusfy/app/pull/${number}`,
        repository: "jusfy/app",
        createdAt: "2026-10-14T14:00:00.000Z",
        avaliou: [],
        naoAvaliou: ["dev"],
        semReviewersSolicitados: false,
        aprovou: [],
        solicitouAlteracoes: [],
        pendente: ["dev"],
        requestedReviewersCount: 1,
        statusGeral: "pending_review" as const,
        slackShare: null,
        localReview: null
      };
    })
  };
}

function reviewerQueueResponse(pending: number, reviewed: number): ReviewerQueueApiSuccess {
  const pendingItems = Array.from({ length: pending }, (_, index) => ({
    id: `fila-${index + 1}`,
    number: 418 + index,
    title: index === 0 ? "Corrigir filtro da sprint" : "Atualizar o briefing do dash",
    url: `https://github.com/jusfy/app/pull/${418 + index}`,
    repository: "jusfy/app",
    myReviewStatus: "pending" as const
  }));
  const reviewedItems = Array.from({ length: reviewed }, (_, index) => ({
    id: `fila-revisada-${index + 1}`,
    number: 401 + index,
    title: "Documentar o deck de atalhos",
    url: `https://github.com/jusfy/app/pull/${401 + index}`,
    repository: "jusfy/app",
    myReviewStatus: "reviewed" as const
  }));

  return {
    status: "ok",
    data: [...pendingItems, ...reviewedItems],
    fetchedAt,
    githubLogin: "dev"
  };
}

const today = todayLocalDateString();
const yesterday = shiftNotebookDay(today, -1);

const filledTasks = tasksResponse([
  openTask("tarefa-1", "Revisar a PR do faturamento", yesterday, true),
  openTask("tarefa-2", "Responder o comentário no Jira", shiftNotebookDay(today, 1), false),
  openTask("tarefa-3", "Atualizar o journal de hoje", null, false)
]);

const filledIssues = issuesResponse([
  jiraIssue("JUS-120", "Ajustar a contagem de férias"),
  jiraIssue("JUS-128", "Revisar o filtro da sprint"),
  jiraIssue("JUS-131", "Atualizar o briefing do dash")
]);

function requestUrl(input: RequestInfo | URL): string {
  if (typeof input === "string") {
    return input;
  }
  if (input instanceof URL) {
    return input.href;
  }
  return input.url;
}

function json(body: unknown, status = 200): Response {
  return Response.json(body, { status });
}

function installFetch(mode: "filled" | "empty" | "unavailable"): () => void {
  const original = globalThis.fetch;
  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    if (mode === "unavailable") {
      return json({ status: "error", message: "Indisponível" }, 503);
    }

    const url = requestUrl(input);
    if (url.includes("/api/tasks/") && init?.method === "PATCH") {
      return json({ ok: true });
    }
    if (url.includes("/api/prs/reviewer-queue")) {
      return json(mode === "filled" ? reviewerQueueResponse(2, 1) : reviewerQueueResponse(0, 0));
    }
    if (url.includes("/api/prs")) {
      return json(mode === "filled" ? prsResponse(4) : prsResponse(0));
    }
    if (url.includes("/api/tasks")) {
      return json(mode === "filled" ? filledTasks : tasksResponse([]));
    }
    if (url.includes("/api/jira/sprints")) {
      return json(sprintsResponse);
    }
    if (url.includes("/api/jira/issues")) {
      return json(mode === "filled" ? filledIssues : issuesResponse([]));
    }
    return json({ message: "Not mocked" }, 404);
  }) as typeof fetch;

  return () => {
    globalThis.fetch = original;
  };
}

const meta = {
  title: "Dashboard/DashboardHub",
  component: DashboardHub,
  parameters: {
    nextjs: {
      appDirectory: true
    }
  },
  beforeEach: () => {
    clearDashboardHubStatsCache();
    const restoreFetch = installFetch("filled");
    return () => {
      clearDashboardHubStatsCache();
      restoreFetch();
    };
  }
} satisfies Meta<typeof DashboardHub>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Empty: Story = {
  beforeEach: () => {
    clearDashboardHubStatsCache();
    const restoreFetch = installFetch("empty");
    return () => {
      clearDashboardHubStatsCache();
      restoreFetch();
    };
  }
};

export const Unavailable: Story = {
  beforeEach: () => {
    clearDashboardHubStatsCache();
    const restoreFetch = installFetch("unavailable");
    return () => {
      clearDashboardHubStatsCache();
      restoreFetch();
    };
  }
};
