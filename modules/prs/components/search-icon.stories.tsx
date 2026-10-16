import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { SearchIcon } from "./search-icon";

const meta = {
  title: "PRs/SearchIcon",
  component: SearchIcon,
  decorators: [
    (Story) => (
      <div className="inline-flex p-3 text-[var(--app-text)]">
        <Story />
      </div>
    )
  ]
} satisfies Meta<typeof SearchIcon>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
