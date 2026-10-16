import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import type { PrLocalReviewInfo, ReviewerQueuePr } from "@/modules/prs/lib/domain";

import { PrReviewerQueueItem } from "./pr-reviewer-queue-item";

const repository = "jusfy/api";
const prNumber = 128;

const basePr: ReviewerQueuePr = {
  id: "PR_128",
  number: prNumber,
  title: "JOR-418 — Ajustar a fila de revisão",
  url: "https://github.com/jusfy/api/pull/128",
  repository,
  myReviewStatus: "pending",
  localReview: null
};

const finishedReview: PrLocalReviewInfo = {
  status: "ok",
  headSha: "b2c3d4e5f6789012345678901234567890abcdef",
  summary: "Há um null esquecido no retry da fila.",
  findings: [
    {
      agent: "correctness",
      path: "modules/prs/components/pr-reviewer-queue-item.tsx",
      line: 28,
      message: "O card não mostra o resumo quando a revisão termina.",
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
  title: "PRs/PrReviewerQueueItem",
  component: PrReviewerQueueItem,
  parameters: {
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
      <ul className="review-queue-page__grid mx-auto max-w-xl">
        <Story />
      </ul>
    )
  ],
  args: {
    pr: basePr,
    reviewInProgress: false
  }
} satisfies Meta<typeof PrReviewerQueueItem>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Running: Story = {
  args: {
    pr: {
      ...basePr,
      localReview: runningReview
    },
    reviewInProgress: true
  }
};

export const Finished: Story = {
  args: {
    pr: {
      ...basePr,
      myReviewStatus: "reviewed",
      localReview: finishedReview
    }
  }
};

export const Error: Story = {
  args: {
    pr: {
      ...basePr,
      localReview: failedReview
    }
  }
};
