import { Suspense } from "react";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { WorkContextProvider } from "@/modules/work-context/components/work-context-provider";

import { OpenPrWizard } from "./open-pr-wizard";

const repositories = [
  { repository: "jusfy/api", defaultBranch: "master" },
  { repository: "jusfy/web", defaultBranch: "main" }
];

const branches = [
  {
    name: "feat/JOR-418/fila-de-revisao",
    issueKey: "JOR-418",
    suggestedTitle: "JOR-418 - Ajustar a fila de revisão",
    jiraSummary: "Ajustar a fila de revisão",
    baseBranch: "master"
  }
];

const generatedBody = [
  "## Contexto",
  "",
  "A fila passa a destacar a revisão local em andamento.",
  "",
  "## Testes",
  "",
  "- Conferir o card da PR 128"
].join("\n");

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

    if (mode === "error" && path === "/api/prs/open/repositories") {
      return Response.json(
        { error: "Nenhum repositório monitorado. Cadastre em Devtools → Repositórios." },
        { status: 400 }
      );
    }

    if (path === "/api/prs/open/repositories") {
      return Response.json({ repositories });
    }

    if (path === "/api/prs/open/base-branches") {
      return Response.json({
        defaultBranch: "master",
        baseBranches: ["master", "develop"]
      });
    }

    if (path === "/api/prs/open/branches") {
      return Response.json({
        branches,
        githubLogin: "rigon",
        branchSource: "jira"
      });
    }

    if (path === "/api/prs/open/generate-body") {
      return Response.json({ body: generatedBody });
    }

    if (path === "/api/prs/open") {
      return Response.json({ url: "https://github.com/jusfy/api/pull/140" });
    }

    return Response.json({ error: "Não foi possível concluir a abertura da PR." }, { status: 404 });
  };

  return () => {
    globalThis.fetch = originalFetch;
  };
}

const meta = {
  title: "PRs/OpenPrWizard",
  component: OpenPrWizard,
  parameters: {
    layout: "fullscreen",
    nextjs: {
      appDirectory: true,
      navigation: {
        pathname: "/prs/open",
        query: {}
      }
    }
  },
  decorators: [
    (Story) => (
      <WorkContextProvider>
        <div className="app-shell">
          <Suspense fallback={null}>
            <Story />
          </Suspense>
        </div>
      </WorkContextProvider>
    )
  ]
} satisfies Meta<typeof OpenPrWizard>;

export default meta;

type Story = StoryObj<typeof meta>;

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
