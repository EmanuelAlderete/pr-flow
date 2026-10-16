import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fn } from "storybook/test";

import type { WorkContext } from "@/modules/work-context/lib/domain";

import { PrJiraTaskDialog } from "./pr-jira-task-dialog";

const issueKey = "JOR-418";

const workContext: WorkContext = {
  issueKey,
  jira: {
    summary: {
      id: "100418",
      key: issueKey,
      summary: "Ajustar a fila de revisão das pull requests",
      statusName: "Em progresso",
      statusCategoryKey: "indeterminate",
      issueTypeName: "História",
      priorityName: "Média",
      updated: "2026-10-15T14:30:00.000Z",
      browseUrl: "https://jusfy.atlassian.net/browse/JOR-418"
    },
    detail: {
      key: issueKey,
      summary: "Ajustar a fila de revisão das pull requests",
      description: "A fila deve destacar a revisão local em andamento.",
      figmaUrls: [],
      hours: null,
      timeProgress: null,
      latestComment: {
        authorName: "ana",
        created: "2026-10-15T16:00:00.000Z",
        body: "O banner da revisão ainda não aparece na fila."
      },
      browseUrl: "https://jusfy.atlassian.net/browse/JOR-418",
      cachedAt: "2026-10-15T14:30:00.000Z"
    }
  },
  pullRequests: [
    {
      number: 128,
      title: "JOR-418 — Ajustar a fila de revisão",
      repository: "jusfy/api",
      url: "https://github.com/jusfy/api/pull/128",
      statusGeral: "pending_review"
    }
  ],
  tasks: [
    { id: "task-1", title: "Revisar o card da fila", completed: false },
    { id: "task-2", title: "Conferir o banner de revisão local", completed: true }
  ],
  journalMentions: [
    {
      notebookDay: "2026-10-15",
      excerpt: "Ajustei a fila do JOR-418 e deixei o banner visível."
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
};

function requestUrl(input: RequestInfo | URL): string {
  if (typeof input === "string") {
    return input;
  }

  if (input instanceof URL) {
    return input.toString();
  }

  return input.url;
}

function installFetch(mode: "ok" | "error" | "pending"): () => void {
  const originalFetch = globalThis.fetch;

  globalThis.fetch = async (input: RequestInfo | URL) => {
    if (mode === "pending") {
      return new Promise(() => undefined);
    }

    const path = new URL(requestUrl(input), "http://storybook.local").pathname;

    if (path === `/api/work-context/${issueKey}`) {
      if (mode === "error") {
        return Response.json({ error: "Não foi possível carregar o contexto." }, { status: 500 });
      }

      return Response.json(workContext);
    }

    return Response.json({ error: "Não foi possível carregar o contexto." }, { status: 404 });
  };

  return () => {
    globalThis.fetch = originalFetch;
  };
}

const meta = {
  title: "PRs/PrJiraTaskDialog",
  component: PrJiraTaskDialog,
  parameters: {
    nextjs: {
      appDirectory: true,
      navigation: {
        pathname: "/prs",
        query: {}
      }
    }
  },
  args: {
    issueKey,
    open: true,
    onOpenChange: fn()
  }
} satisfies Meta<typeof PrJiraTaskDialog>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Open: Story = {
  beforeEach() {
    const restoreFetch = installFetch("ok");
    return () => {
      restoreFetch();
    };
  }
};

export const Default: Story = {
  beforeEach() {
    const restoreFetch = installFetch("ok");
    return () => {
      restoreFetch();
    };
  }
};

export const Loading: Story = {
  beforeEach() {
    const restoreFetch = installFetch("pending");
    return () => {
      restoreFetch();
    };
  }
};

export const Error: Story = {
  beforeEach() {
    const restoreFetch = installFetch("error");
    return () => {
      restoreFetch();
    };
  }
};
