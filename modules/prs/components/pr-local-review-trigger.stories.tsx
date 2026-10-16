import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fn } from "storybook/test";

import type { PrLocalReviewInfo } from "@/modules/prs/lib/domain";

import { PrLocalReviewTrigger } from "./pr-local-review-trigger";

const repository = "jusfy/api";
const prNumber = 128;

const finishedReview: PrLocalReviewInfo = {
  status: "ok",
  headSha: "b2c3d4e5f6789012345678901234567890abcdef",
  summary: "Há um null esquecido no retry da fila.",
  findings: [
    {
      agent: "correctness",
      path: "modules/prs/components/pr-local-review-trigger.tsx",
      line: 12,
      message: "O botão some enquanto outra revisão está em andamento.",
      confidence: 0.9
    }
  ],
  startedAt: "2026-10-16T12:40:00.000Z",
  finishedAt: "2026-10-16T12:48:00.000Z",
  error: null
};

const runningReview: PrLocalReviewInfo = {
  status: "running",
  headSha: "a1b2c3d4e5f6789012345678901234567890abcd",
  summary: null,
  findings: [],
  startedAt: new Date(Date.now() - 4 * 60 * 1000).toISOString(),
  finishedAt: null,
  error: null
};

const failedReview: PrLocalReviewInfo = {
  status: "error",
  headSha: "c3d4e5f6789012345678901234567890abcdef12",
  summary: null,
  findings: [],
  startedAt: "2026-10-16T12:40:00.000Z",
  finishedAt: "2026-10-16T12:48:00.000Z",
  error: "O modelo não devolveu JSON."
};

function installFetch(): () => void {
  const originalFetch = globalThis.fetch;

  globalThis.fetch = async () =>
    Response.json({
      status: "started",
      message: "Revisão de api #128 começou."
    });

  return () => {
    globalThis.fetch = originalFetch;
  };
}

const meta = {
  title: "PRs/PrLocalReviewTrigger",
  component: PrLocalReviewTrigger,
  args: {
    repository,
    prNumber,
    review: null,
    reviewInProgress: false,
    onStarted: fn()
  },
  beforeEach() {
    const restoreFetch = installFetch();
    return () => {
      restoreFetch();
    };
  }
} satisfies Meta<typeof PrLocalReviewTrigger>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Empty: Story = {
  args: {
    review: null
  }
};

export const Running: Story = {
  args: {
    review: runningReview,
    reviewInProgress: true
  }
};

export const Finished: Story = {
  args: {
    review: finishedReview
  }
};

export const Error: Story = {
  args: {
    review: failedReview
  }
};
