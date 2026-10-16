import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import type { JiraIssueDto, JiraIssuesResponse, JiraSprintsResponse } from "@/modules/jira/lib/domain";
import type { WorkContext } from "@/modules/work-context/lib/domain";
import { WorkContextProvider } from "@/modules/work-context/components/work-context-provider";

import { JiraPage } from "./jira-page";

type FetchInput = Parameters<typeof fetch>[0];
type FetchInit = Parameters<typeof fetch>[1];
type StoryFetch = (input: FetchInput, init?: FetchInit) => Promise<Response>;

const sprints = {
  boardId: 42,
  boardName: "Jornada",
  projectKey: "JOR",
  cachedAt: "2026-10-16T12:00:00.000Z",
  sprints: [
    {
      id: 4943,
      name: "Sprint 24",
      state: "active",
      startDate: "2026-10-01T00:00:00.000Z",
      endDate: "2026-10-15T00:00:00.000Z"
    },
    {
      id: 5001,
      name: "Sprint 25",
      state: "future",
      startDate: "2026-10-16T00:00:00.000Z",
      endDate: "2026-10-30T00:00:00.000Z"
    },
    {
      id: 4800,
      name: "Sprint 23",
      state: "closed",
      startDate: "2026-09-16T00:00:00.000Z",
      endDate: "2026-09-30T00:00:00.000Z"
    }
  ]
} satisfies JiraSprintsResponse;

const issues = [
  {
    key: "JOR-275",
    summary: "Ajustar o filtro de sprint no quadro",
    statusName: "A fazer",
    statusCategoryKey: "new",
    issueTypeName: "Tarefa",
    priorityName: "Alta",
    updated: "2026-10-15T18:40:00.000Z",
    browseUrl: "https://jusfy.atlassian.net/browse/JOR-275"
  },
  {
    key: "JOR-281",
    summary: "Publicar o briefing do último dia útil",
    statusName: "Em andamento",
    statusCategoryKey: "indeterminate",
    issueTypeName: "História",
    priorityName: "Média",
    updated: "2026-10-16T11:05:00.000Z",
    browseUrl: "https://jusfy.atlassian.net/browse/JOR-281"
  },
  {
    key: "JOR-190",
    summary: "Corrigir a contagem de tickets vazios",
    statusName: "Concluído",
    statusCategoryKey: "done",
    issueTypeName: "Bug",
    priorityName: "Baixa",
    updated: "2026-10-14T09:12:00.000Z",
    browseUrl: "https://jusfy.atlassian.net/browse/JOR-190"
  }
] satisfies JiraIssueDto[];

const filledIssues = {
  email: "ana.souza@jusfy.com.br",
  displayName: "Ana Souza",
  sprintFilter: "4943",
  cachedAt: "2026-10-16T12:00:00.000Z",
  issues
} satisfies JiraIssuesResponse;

const workContext = {
  issueKey: "JOR-275",
  jira: {
    summary: issues[0],
    detail: null
  },
  pullRequests: [
    {
      number: 1284,
      title: "JOR-275 Ajustar o filtro de sprint no quadro",
      repository: "jusfy/pr-flow",
      url: "https://github.com/jusfy/pr-flow/pull/1284",
      statusGeral: "pending_review"
    }
  ],
  tasks: [{ id: "task-1", title: "Revisar o filtro padrão da sprint", completed: false }],
  journalMentions: [
    {
      notebookDay: "2026-10-15",
      excerpt: "Ajustei o filtro da sprint ativa no JOR-275."
    }
  ],
  gaps: []
} satisfies WorkContext;

function requestUrl(input: FetchInput): string {
  if (typeof input === "string") {
    return input;
  }
  if (input instanceof URL) {
    return input.href;
  }
  return input.url;
}

function pathnameOf(input: FetchInput): string {
  return new URL(requestUrl(input), "http://storybook.local").pathname;
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" }
  });
}

function hang(init?: FetchInit): Promise<Response> {
  return new Promise((_resolve, reject) => {
    const signal = init?.signal;
    if (!signal) {
      return;
    }
    const abort = () => {
      reject(new DOMException("The operation was aborted.", "AbortError"));
    };
    if (signal.aborted) {
      abort();
      return;
    }
    signal.addEventListener("abort", abort, { once: true });
  });
}

function pageFetch(mode: "filled" | "empty" | "stale" | "config" | "error"): StoryFetch {
  return (input) => {
    const path = pathnameOf(input);

    if (path === "/api/jira/sprints") {
      if (mode === "config") {
        return Promise.resolve(
          jsonResponse({ error: "Integração com o Jira não configurada." }, 503)
        );
      }
      return Promise.resolve(jsonResponse(sprints));
    }

    if (path === "/api/jira/issues") {
      if (mode === "error") {
        return Promise.resolve(jsonResponse({ error: "Falha ao carregar tickets." }, 500));
      }
      if (mode === "empty") {
        return Promise.resolve(jsonResponse({ ...filledIssues, issues: [] }));
      }
      if (mode === "stale") {
        return Promise.resolve(
          jsonResponse({
            ...filledIssues,
            syncWarning: "A última sincronização com o Jira falhou. Exibindo o cache local."
          })
        );
      }
      return Promise.resolve(jsonResponse(filledIssues));
    }

    if (path.startsWith("/api/work-context/")) {
      const issueKey = decodeURIComponent(path.split("/").pop() ?? "JOR-275");
      const summary = issues.find((issue) => issue.key === issueKey) ?? issues[0];
      return Promise.resolve(
        jsonResponse({
          ...workContext,
          issueKey,
          jira: { summary, detail: null }
        })
      );
    }

    if (path === "/api/prs/open/repositories") {
      return Promise.resolve(
        jsonResponse({
          repositories: [
            { repository: "jusfy/pr-flow", defaultBranch: "main" },
            { repository: "jusfy/jusfy-front", defaultBranch: "main" }
          ]
        })
      );
    }

    if (path === "/api/prs/open/base-branches") {
      return Promise.resolve(
        jsonResponse({
          defaultBranch: "main",
          baseBranches: ["main", "develop"]
        })
      );
    }

    if (path.endsWith("/branches/suggest")) {
      return Promise.resolve(
        jsonResponse({
          prefix: "feat",
          slug: "adjust-sprint-filter",
          branchName: "feat/jor-275/adjust-sprint-filter",
          aiAvailable: true
        })
      );
    }

    return Promise.resolve(jsonResponse({ error: "Rota não mockada no Storybook." }, 404));
  };
}

let respond: StoryFetch = pageFetch("filled");

const meta = {
  title: "Jira/JiraPage",
  component: JiraPage,
  decorators: [
    (Story) => (
      <WorkContextProvider>
        <Story />
      </WorkContextProvider>
    )
  ],
  parameters: {
    nextjs: {
      appDirectory: true,
      navigation: {
        pathname: "/jira",
        query: {}
      }
    }
  },
  beforeEach: () => {
    respond = pageFetch("filled");
    const originalFetch = globalThis.fetch;
    globalThis.fetch = ((input: FetchInput, init?: FetchInit) =>
      respond(input, init)) as typeof fetch;
    return () => {
      globalThis.fetch = originalFetch;
    };
  }
} satisfies Meta<typeof JiraPage>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Empty: Story = {
  beforeEach: () => {
    respond = pageFetch("empty");
  }
};

export const Loading: Story = {
  beforeEach: () => {
    respond = (_input, init) => hang(init);
  }
};

export const ConfigError: Story = {
  beforeEach: () => {
    respond = pageFetch("config");
  }
};

export const LoadError: Story = {
  beforeEach: () => {
    respond = pageFetch("error");
  }
};

export const StaleCache: Story = {
  beforeEach: () => {
    respond = pageFetch("stale");
  }
};

export const OpenedFromUrl: Story = {
  parameters: {
    nextjs: {
      appDirectory: true,
      navigation: {
        pathname: "/jira",
        query: { issue: "JOR-275" }
      }
    }
  }
};
