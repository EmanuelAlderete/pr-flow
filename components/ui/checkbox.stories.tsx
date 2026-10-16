import type { ComponentProps } from "react";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { Checkbox } from "./checkbox";

const meta = {
  title: "UI/Checkbox",
  component: Checkbox
} satisfies Meta<typeof Checkbox>;

export default meta;

type Story = StoryObj<typeof meta>;

function LabeledCheckbox({ label, ...props }: { label: string } & ComponentProps<typeof Checkbox>) {
  return (
    <label className="flex items-center gap-2 text-sm">
      <Checkbox {...props} />
      {label}
    </label>
  );
}

export const Default: Story = {
  render: () => <LabeledCheckbox label="Incluir fim de semana" />
};

export const Checked: Story = {
  render: () => <LabeledCheckbox label="Incluir fim de semana" defaultChecked />
};

export const Disabled: Story = {
  render: () => <LabeledCheckbox label="Incluir fim de semana" disabled />
};

export const Invalid: Story = {
  render: () => <LabeledCheckbox label="Incluir fim de semana" aria-invalid />
};
