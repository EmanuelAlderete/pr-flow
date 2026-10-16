import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fn } from "storybook/test";

import { PrSlackReshareDialog } from "./pr-slack-reshare-dialog";

const meta = {
  title: "PRs/PrSlackReshareDialog",
  component: PrSlackReshareDialog,
  args: {
    open: true,
    channel: "squad-jornada-pr",
    loading: false,
    onOpenChange: fn(),
    onConfirm: fn()
  }
} satisfies Meta<typeof PrSlackReshareDialog>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Open: Story = {};

export const Default: Story = {};

export const Loading: Story = {
  args: {
    loading: true
  }
};
