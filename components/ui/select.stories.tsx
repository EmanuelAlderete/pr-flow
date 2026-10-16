import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./select";

const meta = {
  title: "UI/Select",
  component: Select
} satisfies Meta<typeof Select>;

export default meta;

type Story = StoryObj<typeof meta>;

const items = [
  { value: "abertas", label: "Abertas" },
  { value: "concluidas", label: "Concluídas" }
];

function StatusSelect({
  open = false,
  size = "default",
  disabled = false,
  invalid = false
}: {
  open?: boolean;
  size?: "default" | "sm";
  disabled?: boolean;
  invalid?: boolean;
}) {
  return (
    <Select defaultOpen={open} defaultValue="abertas" items={items} disabled={disabled}>
      <SelectTrigger className="w-56" size={size} aria-label="Status" aria-invalid={invalid || undefined}>
        <SelectValue placeholder="Selecione o status" />
      </SelectTrigger>
      <SelectContent>
        {items.map((item) => (
          <SelectItem key={item.value} value={item.value}>
            {item.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export const Default: Story = {
  render: () => <StatusSelect open />
};

export const Small: Story = {
  render: () => <StatusSelect size="sm" />
};

export const Disabled: Story = {
  render: () => <StatusSelect disabled />
};

export const Invalid: Story = {
  render: () => <StatusSelect invalid />
};
