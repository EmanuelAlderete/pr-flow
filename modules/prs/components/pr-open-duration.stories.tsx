import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { PrOpenDuration } from "./pr-open-duration";

const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString();

const meta = {
  title: "PRs/PrOpenDuration",
  component: PrOpenDuration,
  args: {
    createdAt: twoDaysAgo
  }
} satisfies Meta<typeof PrOpenDuration>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
