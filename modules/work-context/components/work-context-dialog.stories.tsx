import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fn } from "storybook/test";

import type { WorkContext } from "@/modules/work-context/lib/domain";

import { WorkContextDialog } from "./work-context-dialog";

type FetchInput = Parameters<typeof fetch>[0];
type FetchInit = Parameters<typeof fetch>[1];
type StoryFetch = (input: FetchInput, init?: FetchInit) => Promise<Response>;

const summary = {
  key: "JOR-275",
  summary: "Ajustar o filtro de sprint no quadro",
  statusName: "Em andamento",
  statusCategoryKey: "indeterminate",
  issueTypeName: "Tarefa",
  priorityName: "Alta",
  updated: "2026-10-15T18:40:00.000Z",
  browseUrl: "https://jusfy.atlassian.net/browse/JOR-275"
};

const filledContext = {
  issueKey: "JOR-275",
  jira: {
    summary,
    detail: {
      key: "JOR-275",
      summary: summary.summary,
      description: "Filtrar o quadro pela sprint ativa e deixar a lista vazia explícita.",
      figmaUrls: [],
      hours: "5h",
      timeProgress: null,
      latestComment: null,
      browseUrl: summary.browseUrl,
      cachedAt: "2026-10-16T12:00:00.000Z"
    }
  },
  pullRequests: [
    {
      number: 1284,
      title: "JOR-275 Ajustar o filtro de sprint no quadro",
      repository: "jusfy/pr-flow",
      url: "https://github.com/jusfy/pr-flow/pull/1284",
      statusGeral: "pending_review"
    },
    {
      number: 902,
      title: "JOR-275 Corrige a contagem da sprint",
      repository: "jusfy/jusfy-front",
      url: "https://github.com/jusfy/jusfy-front/pull/902",
      statusGeral: "changes_requested"
    }
  ],
  tasks: [
    { id: "task-1", title: "Revisar o filtro padrão da sprint", completed: false },
    { id: "task-2", title: "Cobrir a sprint encerrada no card", completed: true }
  ],
  journalMentions: [
    {
      notebookDay: "2026-10-15",
      excerpt: "Fechei o filtro da sprint ativa no JOR-275 e deixei o estado vazio coberto."
    }
  ],
  gaps: [
    {
      kind: "task_done_ticket_open",
      severity: "warning",
      message:
        "Há task local concluída, mas o ticket no Jira ainda aparece aberto. Atualize o status no Jira ou reabra a task se o trabalho não terminou."
    }
  ]
} satisfies WorkContext;

const emptyContext = {
  issueKey: "JOR-275",
  jira: { summary, detail: null },
  pullRequests: [],
  tasks: [],
  journalMentions: [],
  gaps: []
} satisfies WorkContext;

const uncachedContext = {
  issueKey: "JOR-275",
  jira: { summary: null, detail: null },
  pullRequests: [],
  tasks: [],
  journalMentions: [],
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

function contextFetch(context: WorkContext): StoryFetch {
  return (input) => {
    const path = pathnameOf(input);
    if (path === "/api/prs/open/repositories") {
      return Promise.resolve(
        jsonResponse({
          repositories: [{ repository: "jusfy/pr-flow", defaultBranch: "main" }]
        })
      );
    }
    if (path.startsWith("/api/work-context/")) {
      return Promise.resolve(jsonResponse(context));
    }
    return Promise.resolve(jsonResponse({ error: "Rota não mockada no Storybook." }, 404));
  };
}

let respond: StoryFetch = contextFetch(filledContext);

const meta = {
  title: "WorkContext/WorkContextDialog",
  component: WorkContextDialog,
  args: {
    issueKey: "JOR-275",
    open: true,
    onOpenChange: fn()
  },
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
    respond = contextFetch(filledContext);
    const originalFetch = globalThis.fetch;
    globalThis.fetch = ((input: FetchInput, init?: FetchInit) =>
      respond(input, init)) as typeof fetch;
    return () => {
      globalThis.fetch = originalFetch;
    };
  }
} satisfies Meta<typeof WorkContextDialog>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Empty: Story = {
  beforeEach: () => {
    respond = contextFetch(emptyContext);
  }
};

export const Uncached: Story = {
  beforeEach: () => {
    respond = contextFetch(uncachedContext);
  }
};

export const Loading: Story = {
  beforeEach: () => {
    respond = (_input, init) => hang(init);
  }
};

export const Error: Story = {
  beforeEach: () => {
    respond = () =>
      Promise.resolve(jsonResponse({ error: "Não foi possível carregar o contexto." }, 500));
  }
};
