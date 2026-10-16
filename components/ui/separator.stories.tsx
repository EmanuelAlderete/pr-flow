import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { Separator } from "./separator";

const meta = {
  title: "UI/Separator",
  component: Separator
} satisfies Meta<typeof Separator>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <div className="w-full max-w-sm">
      <Separator />
    </div>
  )
};

export const Vertical: Story = {
  render: () => (
    <div className="flex h-8 items-center gap-3 text-sm">
      <span>Painel</span>
      <Separator orientation="vertical" />
      <span>Tarefas</span>
    </div>
  )
};
