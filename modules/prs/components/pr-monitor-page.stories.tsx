import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { WorkContextProvider } from "@/modules/work-context/components/work-context-provider";
import type { MonitoredPr, PrApiResponse, PrLocalReviewInfo } from "@/modules/prs/lib/domain";

import { PrMonitorPage } from "./pr-monitor-page";

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

function monitoredPr(
  overrides: Partial<MonitoredPr> & Pick<MonitoredPr, "id" | "number" | "title">
): MonitoredPr {
  return {
    url: `https://github.com/jusfy/api/pull/${overrides.number}`,
    repository: "jusfy/api",
    createdAt: "2026-10-10T12:00:00.000Z",
    avaliou: ["ana"],
    naoAvaliou: ["bruno"],
    semReviewersSolicitados: false,
    aprovou: ["ana"],
    solicitouAlteracoes: [],
    pendente: ["bruno"],
    requestedReviewersCount: 2,
    statusGeral: "pending_review",
    readyToMerge: false,
    hasConflicts: false,
    hasUnresolvedComments: false,
    slackShare: null,
    localReview: null,
    ...overrides
  };
}

const openPrs: MonitoredPr[] = [
  monitoredPr({
    id: "PR_128",
    number: 128,
    title: "JOR-418 — Ajustar a fila de revisão",
    slackShare: {
      sharedAt: "2026-10-15T18:00:00.000Z",
      channel: "squad-jornada-pr"
    }
  }),
  monitoredPr({
    id: "PR_96",
    number: 96,
    title: "JOR-422 — Exibir o banner da revisão local",
    repository: "jusfy/web",
    url: "https://github.com/jusfy/web/pull/96",
    avaliou: ["ana", "bruno"],
    naoAvaliou: [],
    aprovou: ["ana", "bruno"],
    pendente: [],
    statusGeral: "approved",
    readyToMerge: true
  })
];

function okResponse(data: MonitoredPr[]): PrApiResponse {
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

function installFetch(body: PrApiResponse | "pending"): () => void {
  const originalFetch = globalThis.fetch;

  globalThis.fetch = async (input: RequestInfo | URL) => {
    const path = new URL(requestUrl(input), "http://storybook.local").pathname;

    if (body === "pending") {
      return new Promise(() => undefined);
    }

    if (path === "/api/prs") {
      return Response.json(body);
    }

    return Response.json({ error: "Não foi possível carregar o contexto." }, { status: 404 });
  };

  return () => {
    globalThis.fetch = originalFetch;
  };
}

function prepare(body: PrApiResponse | "pending") {
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
  title: "PRs/PrMonitorPage",
  component: PrMonitorPage,
  parameters: {
    layout: "fullscreen",
    nextjs: {
      appDirectory: true,
      navigation: {
        pathname: "/prs",
        query: {}
      }
    }
  },
  decorators: [
    (Story) => (
      <WorkContextProvider>
        <div className="app-shell">
          <Story />
        </div>
      </WorkContextProvider>
    )
  ],
  args: {
    slackConfigured: true
  }
} satisfies Meta<typeof PrMonitorPage>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  beforeEach: prepare(okResponse(openPrs))
};

export const Empty: Story = {
  beforeEach: prepare(okResponse([]))
};

export const Running: Story = {
  beforeEach: prepare(
    okResponse([
      monitoredPr({
        id: "PR_128",
        number: 128,
        title: "JOR-418 — Ajustar a fila de revisão",
        localReview: runningReview
      })
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
