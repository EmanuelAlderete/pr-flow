import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { ptBR } from "date-fns/locale";

import { Calendar } from "./calendar";

const month = new Date(2026, 9, 1);
const selectedDay = new Date(2026, 9, 16);

const meta = {
  title: "UI/Calendar",
  component: Calendar
} satisfies Meta<typeof Calendar>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => <Calendar mode="single" locale={ptBR} defaultMonth={month} selected={selectedDay} />
};

export const Range: Story = {
  render: () => (
    <Calendar
      mode="range"
      locale={ptBR}
      defaultMonth={month}
      selected={{ from: new Date(2026, 9, 13), to: new Date(2026, 9, 17) }}
    />
  )
};
