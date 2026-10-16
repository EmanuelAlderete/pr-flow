import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { userEvent, within } from "storybook/test";

import { Surface } from "@/components/ui/surface";

import { JiraBranchContextMenu } from "./jira-branch-context-menu";

type FetchInput = Parameters<typeof fetch>[0];
type FetchInit = Parameters<typeof fetch>[1];

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

function catalogFetch(input: FetchInput): Promise<Response> {
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
    return Promise.resolve(
      jsonResponse({
        pullRequests: [{ repository: "jusfy/pr-flow" }]
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
    return Promise.resolve(
      jsonResponse({
        defaultBranch: "main",
        baseBranches: ["main", "develop"]
      })
    );
  }

  if (path.includes("/branches")) {
    return Promise.resolve(
      jsonResponse({
        branchName: "feat/jor-275/adjust-sprint-filter",
        createdCount: 1,
        results: [
          {
            repository: "jusfy/pr-flow",
            status: "created",
            branchName: "feat/jor-275/adjust-sprint-filter",
            openPrUrl: "/prs/open?repository=jusfy%2Fpr-flow&branch=feat%2Fjor-275%2Fadjust-sprint-filter"
          }
        ]
      })
    );
  }

  return Promise.resolve(jsonResponse({ error: "Rota não mockada no Storybook." }, 404));
}

const meta = {
  title: "Jira/JiraBranchContextMenu",
  component: JiraBranchContextMenu,
  args: {
    issueKey: "JOR-275",
    issueTypeName: "Tarefa",
    summary: "Ajustar o filtro de sprint no quadro"
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
    globalThis.fetch = ((input: FetchInput, _init?: FetchInit) =>
      catalogFetch(input)) as typeof fetch;
    return () => {
      globalThis.fetch = originalFetch;
    };
  }
} satisfies Meta<typeof JiraBranchContextMenu>;

export default meta;

type Story = StoryObj<typeof meta>;

function Trigger() {
  return (
    <Surface className="max-w-md p-4">
      <p className="text-sm font-medium text-[var(--app-text)]">JOR-275</p>
      <p className="mt-1 text-sm text-[var(--app-text-muted)]">
        Clique com o botão direito para criar a branch deste ticket.
      </p>
    </Surface>
  );
}

export const Default: Story = {
  args: {
    children: <Trigger />
  }
};

export const Open: Story = {
  args: {
    children: <Trigger />
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const target = canvas.getByText(/botão direito/i);
    const rect = target.getBoundingClientRect();
    const clientX = rect.left + rect.width / 2;
    const clientY = rect.top + rect.height / 2;

    await userEvent.pointer({
      keys: "[MouseRight]",
      target,
      coords: { x: clientX, y: clientY, clientX, clientY }
    });
    await within(document.body).findByRole("menuitem", { name: "Criar branch com IA" });
  }
};
