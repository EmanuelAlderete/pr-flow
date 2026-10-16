import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { HelpHint } from "./help-hint";

const meta = {
  title: "UI/HelpHint",
  component: HelpHint,
  args: {
    children: "Resumo do dia, férias e atalhos. Atualiza a cada hora."
  }
} satisfies Meta<typeof HelpHint>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args) => (
    <div className="flex items-center gap-1">
      <span className="text-sm font-medium">Painel</span>
      <HelpHint {...args} />
    </div>
  )
};
