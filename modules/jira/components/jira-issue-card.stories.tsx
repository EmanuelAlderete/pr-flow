import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fn } from "storybook/test";

import type { JiraIssueDto } from "@/modules/jira/lib/domain";

import { JiraIssueCard } from "./jira-issue-card";

type FetchInput = Parameters<typeof fetch>[0];
type FetchInit = Parameters<typeof fetch>[1];

const updatedLabel = "15 out 2026, 15:40";

const newIssue = {
  key: "JOR-275",
  summary: "Ajustar o filtro de sprint no quadro",
  statusName: "A fazer",
  statusCategoryKey: "new",
  issueTypeName: "Tarefa",
  priorityName: "Alta",
  updated: "2026-10-15T18:40:00.000Z",
  browseUrl: "https://jusfy.atlassian.net/browse/JOR-275"
} satisfies JiraIssueDto;

const inProgressIssue = {
  key: "JOR-281",
  summary: "Publicar o briefing do último dia útil",
  statusName: "Em andamento",
  statusCategoryKey: "indeterminate",
  issueTypeName: "História",
  priorityName: "Média",
  updated: "2026-10-16T11:05:00.000Z",
  browseUrl: "https://jusfy.atlassian.net/browse/JOR-281"
} satisfies JiraIssueDto;

const doneIssue = {
  key: "JOR-190",
  summary: "Corrigir a contagem de tickets vazios",
  statusName: "Concluído",
  statusCategoryKey: "done",
  issueTypeName: "Bug",
  priorityName: "Baixa",
  updated: "2026-10-14T09:12:00.000Z",
  browseUrl: "https://jusfy.atlassian.net/browse/JOR-190"
} satisfies JiraIssueDto;

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

function catalogFetch(input: FetchInput, _init?: FetchInit): Promise<Response> {
  const path = pathnameOf(input);

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

  if (path.startsWith("/api/work-context/")) {
    return Promise.resolve(jsonResponse({ pullRequests: [] }));
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

  if (path.endsWith("/branches/check")) {
    return Promise.resolve(
      jsonResponse({
        branchName: "feat/jor-275/adjust-sprint-filter",
        checks: [{ repository: "jusfy/pr-flow", exists: false }]
      })
    );
  }

  if (path.includes("/branches")) {
    return Promise.resolve(
      jsonResponse({
        branchName: "feat/jor-275/adjust-sprint-filter",
        createdCount: 1,
        results: []
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

  return Promise.resolve(jsonResponse({ error: "Rota não mockada no Storybook." }, 404));
}

const meta = {
  title: "Jira/JiraIssueCard",
  component: JiraIssueCard,
  args: {
    updatedLabel,
    onOpenDetail: fn()
  },
  decorators: [
    (Story) => (
      <div className="max-w-xl">
        <Story />
      </div>
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
    globalThis.fetch = ((input: FetchInput, init?: FetchInit) =>
      catalogFetch(input, init)) as typeof fetch;
    return () => {
      globalThis.fetch = originalFetch;
    };
  }
} satisfies Meta<typeof JiraIssueCard>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    issue: newIssue
  }
};

export const InProgress: Story = {
  args: {
    issue: inProgressIssue,
    updatedLabel: "16 out 2026, 11:05"
  }
};

export const Done: Story = {
  args: {
    issue: doneIssue,
    updatedLabel: "14 out 2026, 09:12"
  }
};
