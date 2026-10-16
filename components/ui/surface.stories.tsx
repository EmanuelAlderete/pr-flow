import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { Surface } from "./surface";

const meta = {
  title: "UI/Surface",
  component: Surface,
  args: {
    children: "Tarefas abertas desta semana.",
    className: "max-w-md p-4 text-sm"
  }
} satisfies Meta<typeof Surface>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Inset: Story = {
  args: {
    variant: "inset"
  }
};

export const Dashed: Story = {
  args: {
    variant: "dashed"
  }
};
