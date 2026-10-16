import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { PrCardSlackSharedBadge } from "./pr-card-slack-shared-badge";

const meta = {
  title: "PRs/PrCardSlackSharedBadge",
  component: PrCardSlackSharedBadge,
  args: {
    slackShare: {
      sharedAt: "2026-05-28T15:00:00.000Z",
      channel: "squad-jornada-pr"
    }
  }
} satisfies Meta<typeof PrCardSlackSharedBadge>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
