import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import type { WorkContext } from "@/modules/work-context/lib/domain";

import { JiraIssueLink } from "./jira-issue-link";
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
  title: "WorkContext/JiraIssueLink",
  component: JiraIssueLink,
  args: {
    issueKey: "JOR-275",
    children: "JOR-275 — Ajustar o filtro de sprint no quadro"
  },
  decorators: [
    (Story) => (
      <WorkContextProvider>
        <div className="max-w-lg text-sm text-[var(--app-text)]">
          <Story />
        </div>
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
    const originalFetch = globalThis.fetch;
    globalThis.fetch = ((input: FetchInput, _init?: FetchInit) => {
      const raw = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
      const path = new URL(raw, "http://storybook.local").pathname;
      if (path === "/api/prs/open/repositories") {
        return Promise.resolve(jsonResponse({ repositories: [] }));
      }
      return Promise.resolve(jsonResponse(workContext));
    }) as typeof fetch;
    return () => {
      globalThis.fetch = originalFetch;
    };
  }
} satisfies Meta<typeof JiraIssueLink>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
