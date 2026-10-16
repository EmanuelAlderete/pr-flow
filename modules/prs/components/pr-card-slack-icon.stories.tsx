import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { PrCardSlackIcon } from "./pr-card-slack-icon";

const meta = {
  title: "PRs/PrCardSlackIcon",
  component: PrCardSlackIcon,
  decorators: [
    (Story) => (
      <div className="inline-flex p-3 text-[var(--app-text)]">
        <Story />
      </div>
    )
  ]
} satisfies Meta<typeof PrCardSlackIcon>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
