import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import type { PrLocalReviewInfo, ReviewerQueueApiResponse, ReviewerQueuePr } from "@/modules/prs/lib/domain";

import { PrReviewerQueuePage } from "./pr-reviewer-queue-page";

const MONITOR_SYNC_KEY = "pr-flow:last-sync";
const REVIEWER_QUEUE_KEY = "pr-flow:reviewer-queue-last-sync";
const FETCHED_AT = "2026-10-16T13:00:00.000Z";

const runningReview: PrLocalReviewInfo = {
  status: "running",
  headSha: "a1b2c3d4e5f6789012345678901234567890abcd",
  summary: null,
  findings: [],
  startedAt: new Date(Date.now() - 4 * 60 * 1000).toISOString(),
  finishedAt: null,
  error: null
};

const finishedReview: PrLocalReviewInfo = {
  status: "ok",
  headSha: "b2c3d4e5f6789012345678901234567890abcdef",
  summary: "Há um null esquecido no retry da fila.",
  findings: [
    {
      agent: "correctness",
      path: "modules/prs/components/pr-reviewer-queue-page.tsx",
      line: 42,
      message: "O filtro ignora PRs dispensadas quando a fila recarrega.",
      confidence: 0.91
    }
  ],
  startedAt: "2026-10-16T12:40:00.000Z",
  finishedAt: "2026-10-16T12:48:00.000Z",
  error: null
};

const queue: ReviewerQueuePr[] = [
  {
    id: "PR_128",
    number: 128,
    title: "JOR-418 — Ajustar a fila de revisão",
    url: "https://github.com/jusfy/api/pull/128",
    repository: "jusfy/api",
    myReviewStatus: "pending",
    localReview: null
  },
  {
    id: "PR_96",
    number: 96,
    title: "JOR-422 — Exibir o banner da revisão local",
    url: "https://github.com/jusfy/web/pull/96",
    repository: "jusfy/web",
    myReviewStatus: "reviewed",
    localReview: finishedReview
  },
  {
    id: "PR_77",
    number: 77,
    title: "JOR-390 — Remover o aviso de sincronização antiga",
    url: "https://github.com/jusfy/api/pull/77",
    repository: "jusfy/api",
    myReviewStatus: "dismissed",
    localReview: null
  }
];

function okResponse(data: ReviewerQueuePr[]): ReviewerQueueApiResponse {
  return {
    status: "ok",
    data,
    fetchedAt: FETCHED_AT,
    githubLogin: "rigon"
  };
}

function requestUrl(input: RequestInfo | URL): string {
  if (typeof input === "string") {
    return input;
  }

  if (input instanceof URL) {
    return input.toString();
  }

  return input.url;
}

function restoreStorageItem(storage: Storage, key: string, previous: string | null) {
  if (previous === null) {
    storage.removeItem(key);
    return;
  }

  storage.setItem(key, previous);
}

function isolateSyncStorage(): () => void {
  const previousMonitor = window.localStorage.getItem(MONITOR_SYNC_KEY);
  const previousQueue = window.localStorage.getItem(REVIEWER_QUEUE_KEY);
  window.localStorage.removeItem(MONITOR_SYNC_KEY);
  window.localStorage.removeItem(REVIEWER_QUEUE_KEY);

  return () => {
    restoreStorageItem(window.localStorage, MONITOR_SYNC_KEY, previousMonitor);
    restoreStorageItem(window.localStorage, REVIEWER_QUEUE_KEY, previousQueue);
  };
}

function installFetch(body: ReviewerQueueApiResponse | "pending"): () => void {
  const originalFetch = globalThis.fetch;

  globalThis.fetch = async (input: RequestInfo | URL) => {
    const path = new URL(requestUrl(input), "http://storybook.local").pathname;

    if (body === "pending") {
      return new Promise(() => undefined);
    }

    if (path === "/api/prs/reviewer-queue") {
      return Response.json(body);
    }

    if (path === "/api/prs") {
      return Response.json({ status: "ok" });
    }

    return Response.json({ error: "Não foi possível carregar a fila." }, { status: 404 });
  };

  return () => {
    globalThis.fetch = originalFetch;
  };
}

function prepare(body: ReviewerQueueApiResponse | "pending") {
  return () => {
    const restoreStorage = isolateSyncStorage();
    const restoreFetch = installFetch(body);

    return () => {
      restoreFetch();
      restoreStorage();
    };
  };
}

const meta = {
  title: "PRs/PrReviewerQueuePage",
  component: PrReviewerQueuePage,
  parameters: {
    layout: "fullscreen",
    nextjs: {
      appDirectory: true,
      navigation: {
        pathname: "/prs/reviews",
        query: {}
      }
    }
  },
  decorators: [
    (Story) => (
      <div className="app-shell">
        <Story />
      </div>
    )
  ]
} satisfies Meta<typeof PrReviewerQueuePage>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  beforeEach: prepare(okResponse(queue))
};

export const Empty: Story = {
  beforeEach: prepare(okResponse([]))
};

export const Running: Story = {
  beforeEach: prepare(
    okResponse([
      {
        ...queue[0],
        localReview: runningReview
      }
    ])
  )
};

export const Unauthenticated: Story = {
  beforeEach: prepare({
    status: "unauthenticated",
    message: "GitHub CLI sem autenticação."
  })
};

export const Error: Story = {
  beforeEach: prepare({
    status: "error",
    message: "Não foi possível falar com o GitHub."
  })
};

export const Loading: Story = {
  beforeEach: prepare("pending")
};
