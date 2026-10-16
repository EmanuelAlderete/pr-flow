import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { localReviewUsageSchema } from "@/modules/prs/lib/local-review/local-review-usage";

import { PrLocalReviewPage } from "./pr-local-review-page";

const headSha = "b2c3d4e5f6789012345678901234567890abcdef";

const usage = localReviewUsageSchema.parse({
  requestedModel: "haiku",
  totalCostUsd: 0.42,
  peakContextTokens: 176078,
  peakModel: "claude-haiku-4-5",
  models: [
    {
      id: "claude-haiku-4-5",
      inputTokens: 12000,
      outputTokens: 1800,
      cacheReadInputTokens: 40000,
      cacheCreationInputTokens: 2000,
      thinkingTokens: 320,
      contextWindow: 200000,
      costUsd: 0.42
    }
  ]
});

const finishedReading = {
  repository: "jusfy/api",
  prNumber: 128,
  title: "JOR-418 — Ajustar a fila de revisão",
  url: "https://github.com/jusfy/api/pull/128",
  headSha,
  status: "ok" as const,
  error: null,
  finishedAt: "2026-10-16T12:48:00.000Z",
  model: "haiku",
  report: {
    summary: "Há um null esquecido no retry da fila. O restante só renomeia variável local.",
    docsLoaded: ["docs/design-system.md", "CONTEXT.md"],
    findings: [
      {
        agent: "correctness",
        path: "modules/prs/components/pr-reviewer-queue-page.tsx",
        line: 42,
        message: "O filtro ignora PRs dispensadas quando a fila recarrega.",
        confidence: 0.91
      },
      {
        agent: "contracts",
        path: "modules/prs/lib/domain.ts",
        line: 99,
        message: "O contrato da fila não descreve o banner de revisão em andamento.",
        confidence: 0.88
      }
    ],
    notCommented: ["modules/prs/components/pr-search-bar.tsx — sem mudança de comportamento"],
    cleanJustification: "O restante só renomeia variável local e não altera o fluxo.",
    traceability: [
      {
        item: "A fila destaca a revisão local em andamento.",
        status: "met" as const
      }
    ],
    metaReview: {
      dropped: [],
      notes: "Nenhum achado foi descartado. Os dois apontamentos permanecem."
    }
  },
  usage
};

const meta = {
  title: "PRs/PrLocalReviewPage",
  component: PrLocalReviewPage,
  parameters: {
    layout: "fullscreen",
    nextjs: {
      appDirectory: true,
      navigation: {
        pathname: "/prs/jusfy/api/128",
        query: {}
      }
    }
  },
  args: {
    reading: finishedReading
  }
} satisfies Meta<typeof PrLocalReviewPage>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Empty: Story = {
  args: {
    reading: null
  }
};

export const Running: Story = {
  args: {
    reading: {
      repository: "jusfy/api",
      prNumber: 128,
      title: "JOR-418 — Ajustar a fila de revisão",
      url: "https://github.com/jusfy/api/pull/128",
      headSha: "a1b2c3d4e5f6789012345678901234567890abcd",
      status: "running",
      error: null,
      finishedAt: null,
      model: "haiku",
      report: null,
      usage: null
    }
  }
};

export const Error: Story = {
  args: {
    reading: {
      repository: "jusfy/api",
      prNumber: 128,
      title: "JOR-418 — Ajustar a fila de revisão",
      url: "https://github.com/jusfy/api/pull/128",
      headSha: "c3d4e5f6789012345678901234567890abcdef12",
      status: "error",
      error: "O modelo não devolveu JSON.",
      finishedAt: "2026-10-16T12:48:00.000Z",
      model: "haiku",
      report: null,
      usage: null
    }
  }
};
