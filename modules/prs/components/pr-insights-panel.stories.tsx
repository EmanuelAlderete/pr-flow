import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import type { PrInsights } from "@/modules/prs/lib/pr-metrics";

import { PrInsightsPanel } from "./pr-insights-panel";

const withQueue: PrInsights = {
  openPrCount: 4,
  coolingPrCount: 2,
  averageOpenDays: 3.5,
  pendingReviewCount: 1,
  averageTimeToFirstReviewHours: 18
};

const meta = {
  title: "PRs/PrInsightsPanel",
  component: PrInsightsPanel,
  parameters: {
    nextjs: {
      appDirectory: true
    }
  },
  args: {
    insights: withQueue
  }
} satisfies Meta<typeof PrInsightsPanel>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithoutFirstReview: Story = {
  args: {
    insights: {
      ...withQueue,
      averageTimeToFirstReviewHours: null
    }
  }
};

export const Empty: Story = {
  args: {
    insights: {
      openPrCount: 0,
      coolingPrCount: 0,
      averageOpenDays: null,
      pendingReviewCount: 0,
      averageTimeToFirstReviewHours: null
    }
  }
};
