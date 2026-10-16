import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fn } from "storybook/test";

import type { JiraIssueDetailDto } from "@/modules/jira/lib/domain";

import { JiraIssueDialog } from "./jira-issue-dialog";

type FetchInput = Parameters<typeof fetch>[0];
type FetchInit = Parameters<typeof fetch>[1];
type StoryFetch = (input: FetchInput, init?: FetchInit) => Promise<Response>;

const filledDetail = {
  key: "JOR-275",
  summary: "Ajustar o filtro de sprint no quadro",
  description:
    "O quadro mistura tickets da sprint ativa com sprints já encerradas. O filtro padrão deve abrir na sprint em andamento e manter a opção de ver todas.",
  figmaUrls: ["https://www.figma.com/design/a1b2c3/Quadro-de-tickets"],
  hours: "5h",
  timeProgress: {
    estimateSeconds: 18000,
    spentSeconds: 10800,
    remainingSeconds: 7200,
    estimateLabel: "5h",
    spentLabel: "3h",
    remainingLabel: "2h",
    percent: 60
  },
  latestComment: {
    authorName: "Ana Souza",
    created: "2026-10-15T14:30:00.000Z",
    body: "O filtro padrão deve cair na sprint ativa quando ela existir."
  },
  browseUrl: "https://jusfy.atlassian.net/browse/JOR-275",
  cachedAt: "2026-10-16T12:00:00.000Z"
} satisfies JiraIssueDetailDto;

const emptyDetail = {
  key: "JOR-275",
  summary: "Ajustar o filtro de sprint no quadro",
  description: null,
  figmaUrls: [],
  hours: null,
  timeProgress: null,
  latestComment: null,
  browseUrl: "https://jusfy.atlassian.net/browse/JOR-275",
  cachedAt: "2026-10-16T12:00:00.000Z"
} satisfies JiraIssueDetailDto;

const overEstimateDetail = {
  ...filledDetail,
  timeProgress: {
    estimateSeconds: 7200,
    spentSeconds: 10800,
    remainingSeconds: null,
    estimateLabel: "2h",
    spentLabel: "3h",
    remainingLabel: null,
    percent: 150
  }
} satisfies JiraIssueDetailDto;

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

function detailFetch(detail: JiraIssueDetailDto): StoryFetch {
  return () => Promise.resolve(jsonResponse(detail));
}

let respond: StoryFetch = detailFetch(filledDetail);

const meta = {
  title: "Jira/JiraIssueDialog",
  component: JiraIssueDialog,
  args: {
    issueKey: "JOR-275",
    open: true,
    onOpenChange: fn()
  },
  beforeEach: () => {
    respond = detailFetch(filledDetail);
    const originalFetch = globalThis.fetch;
    globalThis.fetch = ((input: FetchInput, init?: FetchInit) =>
      respond(input, init)) as typeof fetch;
    return () => {
      globalThis.fetch = originalFetch;
    };
  }
} satisfies Meta<typeof JiraIssueDialog>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Empty: Story = {
  beforeEach: () => {
    respond = detailFetch(emptyDetail);
  }
};

export const OverEstimate: Story = {
  beforeEach: () => {
    respond = detailFetch(overEstimateDetail);
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
      Promise.resolve(jsonResponse({ error: "Não foi possível carregar o ticket." }, 404));
  }
};
