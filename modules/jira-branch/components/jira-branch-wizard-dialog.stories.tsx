import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fn } from "storybook/test";

import { JiraBranchWizardDialog } from "./jira-branch-wizard-dialog";

type FetchInput = Parameters<typeof fetch>[0];
type FetchInit = Parameters<typeof fetch>[1];
type StoryFetch = (input: FetchInput, init?: FetchInit) => Promise<Response>;

const repositories = [
  { repository: "jusfy/pr-flow", defaultBranch: "main" },
  { repository: "jusfy/jusfy-front", defaultBranch: "main" },
  { repository: "jusfy/jusfy-backend", defaultBranch: "master" }
];

const createdResult = {
  repository: "jusfy/pr-flow",
  status: "created" as const,
  branchName: "feat/jor-275/adjust-sprint-filter",
  openPrUrl: "/prs/open?repository=jusfy%2Fpr-flow&branch=feat%2Fjor-275%2Fadjust-sprint-filter"
};

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

function wizardFetch(options: { repositories: typeof repositories; failRepositories?: boolean }): StoryFetch {
  return (input, init) => {
    const path = pathnameOf(input);

    if (path === "/api/prs/open/repositories") {
      if (options.failRepositories) {
        return Promise.resolve(jsonResponse({ error: "Falha ao carregar repositórios." }, 500));
      }
      return Promise.resolve(jsonResponse({ repositories: options.repositories }));
    }

    if (path.startsWith("/api/work-context/")) {
      return Promise.resolve(
        jsonResponse({
          pullRequests: options.repositories.length > 0 ? [{ repository: "jusfy/pr-flow" }] : []
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

    if (path.endsWith("/branches/check")) {
      return Promise.resolve(
        jsonResponse({
          branchName: "feat/jor-275/adjust-sprint-filter",
          checks: [{ repository: "jusfy/pr-flow", exists: false }]
        })
      );
    }

    if (path === "/api/prs/open/base-branches") {
      const repository = new URL(requestUrl(input), "http://storybook.local").searchParams.get("repository");
      const match = options.repositories.find((item) => item.repository === repository);
      const defaultBranch = match?.defaultBranch ?? "main";
      return Promise.resolve(
        jsonResponse({
          defaultBranch,
          baseBranches: [defaultBranch, "develop"]
        })
      );
    }

    if (path.includes("/branches")) {
      return Promise.resolve(
        jsonResponse({
          branchName: createdResult.branchName,
          createdCount: 1,
          results: [createdResult]
        })
      );
    }

    if (init?.signal?.aborted) {
      return hang(init);
    }

    return Promise.resolve(jsonResponse({ error: "Rota não mockada no Storybook." }, 404));
  };
}

let respond: StoryFetch = wizardFetch({ repositories });

const meta = {
  title: "Jira/JiraBranchWizardDialog",
  component: JiraBranchWizardDialog,
  args: {
    issueKey: "JOR-275",
    issueTypeName: "Tarefa",
    summary: "Ajustar o filtro de sprint no quadro",
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
    respond = wizardFetch({ repositories });
    const originalFetch = globalThis.fetch;
    globalThis.fetch = ((input: FetchInput, init?: FetchInit) =>
      respond(input, init)) as typeof fetch;
    return () => {
      globalThis.fetch = originalFetch;
    };
  }
} satisfies Meta<typeof JiraBranchWizardDialog>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Empty: Story = {
  beforeEach: () => {
    respond = wizardFetch({ repositories: [] });
  }
};

export const Loading: Story = {
  beforeEach: () => {
    respond = (_input, init) => hang(init);
  }
};

export const Error: Story = {
  beforeEach: () => {
    respond = wizardFetch({ repositories, failRepositories: true });
  }
};
