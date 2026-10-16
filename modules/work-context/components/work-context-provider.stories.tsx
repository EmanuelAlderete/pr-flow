import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import type { WorkContext } from "@/modules/work-context/lib/domain";

import { WorkContextProvider } from "./work-context-provider";

type FetchInput = Parameters<typeof fetch>[0];
type FetchInit = Parameters<typeof fetch>[1];

const workContext = {
  issueKey: "JOR-275",
  jira: {
    summary: {
      key: "JOR-275",
      summary: "Ajustar o filtro de sprint no quadro",
      statusName: "Em andamento",
      statusCategoryKey: "indeterminate",
      issueTypeName: "Tarefa",
      priorityName: "Alta",
      updated: "2026-10-15T18:40:00.000Z",
      browseUrl: "https://jusfy.atlassian.net/browse/JOR-275"
    },
    detail: null
  },
  pullRequests: [],
  tasks: [],
  journalMentions: [],
  gaps: []
} satisfies WorkContext;

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" }
  });
}

const meta = {
  title: "WorkContext/WorkContextProvider",
  component: WorkContextProvider,
  args: {
    children: (
      <p className="max-w-lg text-sm leading-relaxed text-[var(--app-text-muted)]">
        Nenhum contexto de trabalho aberto. Escolha um ticket do Jira para reunir pull requests,
        tasks e o journal.
      </p>
    )
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
    const originalFetch = globalThis.fetch;
    globalThis.fetch = ((_input: FetchInput, _init?: FetchInit) =>
      Promise.resolve(jsonResponse(workContext))) as typeof fetch;
    return () => {
      globalThis.fetch = originalFetch;
    };
  }
} satisfies Meta<typeof WorkContextProvider>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
