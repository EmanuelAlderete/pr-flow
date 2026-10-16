import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { Input } from "./input";

const meta = {
  title: "UI/Input",
  component: Input,
  args: {
    placeholder: "Título da tarefa",
    "aria-label": "Título da tarefa",
    className: "max-w-sm"
  }
} satisfies Meta<typeof Input>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Disabled: Story = {
  args: {
    disabled: true,
    defaultValue: "Revisar pull request"
  }
};

export const Invalid: Story = {
  args: {
    "aria-invalid": true,
    defaultValue: "Título"
  }
};
