import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import type { PrLocalReviewInfo } from "@/modules/prs/lib/domain";

import { PrLocalReviewBlock, PrLocalReviewRunningBanner } from "./pr-local-review-block";

const repository = "jusfy/api";
const prNumber = 128;

const finishedReview: PrLocalReviewInfo = {
  status: "ok",
  headSha: "b2c3d4e5f6789012345678901234567890abcdef",
  summary: "Há um null esquecido no retry da fila.",
  findings: [
    {
      agent: "correctness",
      path: "modules/prs/components/pr-local-review-block.tsx",
      line: 18,
      message: "O resumo da revisão fica cortado no card.",
      confidence: 0.91
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

const meta = {
  title: "PRs/PrLocalReviewBlock",
  component: PrLocalReviewBlock,
  parameters: {
    nextjs: {
      appDirectory: true,
      navigation: {
        pathname: "/prs/jusfy/api/128",
        query: {}
      }
    }
  },
  decorators: [
    (Story) => (
      <div className="max-w-xl">
        <Story />
      </div>
    )
  ],
  args: {
    repository,
    prNumber,
    review: finishedReview
  }
} satisfies Meta<typeof PrLocalReviewBlock>;

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
    review: runningReview
  }
};

export const Error: Story = {
  args: {
    review: failedReview
  }
};

export const RunningBanner: Story = {
  render: () => (
    <PrLocalReviewRunningBanner
      repository={repository}
      prNumber={prNumber}
      startedAt={runningReview.startedAt}
    />
  )
};
