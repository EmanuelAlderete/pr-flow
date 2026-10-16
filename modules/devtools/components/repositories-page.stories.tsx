import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { userEvent, within } from "storybook/test";

import { RepositoriesPage } from "./repositories-page";

type FetchInput = Parameters<typeof fetch>[0];
type FetchInit = Parameters<typeof fetch>[1];
type StoryFetch = (input: FetchInput, init?: FetchInit) => Promise<Response>;

type RepositoryRecord = {
  id: string;
  repository: string;
  defaultBranch: string;
  sortOrder: number;
};

const filledRepositories = [
  {
    id: "repo-1",
    repository: "jusfy/pr-flow",
    defaultBranch: "main",
    sortOrder: 0
  },
  {
    id: "repo-2",
    repository: "jusfy/jusfy-front",
    defaultBranch: "main",
    sortOrder: 1
  },
  {
    id: "repo-3",
    repository: "jusfy/jusfy-backend",
    defaultBranch: "master",
    sortOrder: 2
  }
] satisfies RepositoryRecord[];

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

function repositoriesFetch(records: RepositoryRecord[]): StoryFetch {
  return (input, init) => {
    const path = pathnameOf(input);
    const method = init?.method ?? (input instanceof Request ? input.method : "GET");

    if (path === "/api/settings/repositories" && method === "GET") {
      return Promise.resolve(jsonResponse({ repositories: records }));
    }

    if (path === "/api/settings/repositories" && method === "POST") {
      return Promise.resolve(
        jsonResponse({
          id: "repo-new",
          repository: "jusfy/nova-app",
          defaultBranch: "main",
          sortOrder: records.length
        })
      );
    }

    if (path.startsWith("/api/settings/repositories/") && method === "PATCH") {
      return Promise.resolve(jsonResponse({ ok: true }));
    }

    if (path.startsWith("/api/settings/repositories/") && method === "DELETE") {
      return Promise.resolve(jsonResponse({ ok: true }));
    }

    return Promise.resolve(jsonResponse({ error: "Rota não mockada no Storybook." }, 404));
  };
}

let respond: StoryFetch = repositoriesFetch(filledRepositories);

const meta = {
  title: "Devtools/RepositoriesPage",
  component: RepositoriesPage,
  beforeEach: () => {
    respond = repositoriesFetch(filledRepositories);
    const originalFetch = globalThis.fetch;
    globalThis.fetch = ((input: FetchInput, init?: FetchInit) =>
      respond(input, init)) as typeof fetch;
    return () => {
      globalThis.fetch = originalFetch;
    };
  }
} satisfies Meta<typeof RepositoriesPage>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Empty: Story = {
  beforeEach: () => {
    respond = repositoriesFetch([]);
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
      Promise.resolve(jsonResponse({ error: "Falha ao carregar repositórios." }, 500));
  }
};

export const CreateDialog: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await canvas.findByText("jusfy/pr-flow");
    await userEvent.click(canvas.getByRole("button", { name: "Cadastrar repositório" }));
  }
};
