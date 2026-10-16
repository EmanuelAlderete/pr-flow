import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { DatePicker } from "./date-picker";

const meta = {
  title: "UI/DatePicker",
  component: DatePicker,
  args: {
    value: "",
    onChange: () => {}
  }
} satisfies Meta<typeof DatePicker>;

export default meta;

type Story = StoryObj<typeof meta>;

function DatePickerStory({
  initialValue = "",
  disabled = false,
  invalid = false
}: {
  initialValue?: string;
  disabled?: boolean;
  invalid?: boolean;
}) {
  const [value, setValue] = useState(initialValue);

  return (
    <DatePicker
      value={value}
      onChange={setValue}
      disabled={disabled}
      aria-invalid={invalid || undefined}
      className="max-w-xs"
    />
  );
}

export const Default: Story = {
  render: () => <DatePickerStory />
};

export const Selected: Story = {
  render: () => <DatePickerStory initialValue="2026-10-16" />
};

export const Disabled: Story = {
  render: () => <DatePickerStory initialValue="2026-10-16" disabled />
};

export const Invalid: Story = {
  render: () => <DatePickerStory invalid />
};
