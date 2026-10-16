import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { localReviewUsageSchema } from "@/modules/prs/lib/local-review/local-review-usage";

import { PrLocalReviewUsage } from "./pr-local-review-usage";

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

const meta = {
  title: "PRs/PrLocalReviewUsage",
  component: PrLocalReviewUsage,
  args: {
    usage
  }
} satisfies Meta<typeof PrLocalReviewUsage>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
