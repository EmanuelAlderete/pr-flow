import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { Button } from "./button";
import { Popover, PopoverContent, PopoverDescription, PopoverHeader, PopoverTitle, PopoverTrigger } from "./popover";

const meta = {
  title: "UI/Popover",
  component: Popover
} satisfies Meta<typeof Popover>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <Popover defaultOpen>
      <PopoverTrigger render={<Button variant="outline" />}>Atalhos</PopoverTrigger>
      <PopoverContent>
        <PopoverHeader>
          <PopoverTitle>Atalhos</PopoverTitle>
          <PopoverDescription>Atalhos salvos neste navegador.</PopoverDescription>
        </PopoverHeader>
      </PopoverContent>
    </Popover>
  )
};
