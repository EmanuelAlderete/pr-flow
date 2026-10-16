import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { Textarea } from "./textarea";

const meta = {
  title: "UI/Textarea",
  component: Textarea,
  args: {
    placeholder: "Notas do dia",
    "aria-label": "Notas do dia",
    className: "max-w-md"
  }
} satisfies Meta<typeof Textarea>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Disabled: Story = {
  args: {
    disabled: true,
    defaultValue: "Revisei a fila e deixei o resumo para amanhã."
  }
};

export const Invalid: Story = {
  args: {
    "aria-invalid": true,
    defaultValue: "Nota sem título"
  }
};
