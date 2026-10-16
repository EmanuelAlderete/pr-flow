import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { ReviewerListItem } from "./reviewer-list-item";

const meta = {
  title: "PRs/ReviewerListItem",
  component: ReviewerListItem,
  decorators: [
    (Story) => (
      <section className="pr-reviewer-group max-w-xs">
        <ul className="reviewer-list">
          <Story />
        </ul>
      </section>
    )
  ],
  args: {
    login: "ana",
    reviewed: true
  }
} satisfies Meta<typeof ReviewerListItem>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Pending: Story = {
  args: {
    login: "bruno",
    reviewed: false
  }
};

export const Both: Story = {
  render: () => (
    <>
      <ReviewerListItem login="ana" reviewed />
      <ReviewerListItem login="bruno" reviewed={false} />
    </>
  )
};
