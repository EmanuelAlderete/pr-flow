import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { Button } from "./button";
import { Tooltip, TooltipContent, TooltipTrigger } from "./tooltip";

const meta = {
  title: "UI/Tooltip",
  component: Tooltip
} satisfies Meta<typeof Tooltip>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <div className="pt-10">
      <Tooltip defaultOpen>
        <TooltipTrigger render={<Button variant="outline" />}>Revisão local</TooltipTrigger>
        <TooltipContent>Revisão local da pull request</TooltipContent>
      </Tooltip>
    </div>
  )
};
