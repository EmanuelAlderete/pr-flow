import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { SyncIcon } from "./sync-icon";

const meta = {
  title: "PRs/SyncIcon",
  component: SyncIcon,
  decorators: [
    (Story) => (
      <div className="inline-flex p-3 text-[var(--app-text)]">
        <Story />
      </div>
    )
  ]
} satisfies Meta<typeof SyncIcon>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
