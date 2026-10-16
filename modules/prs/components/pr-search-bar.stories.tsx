import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fn, userEvent, within } from "storybook/test";

import { PrSearchBar } from "./pr-search-bar";

const meta = {
  title: "PRs/PrSearchBar",
  component: PrSearchBar,
  decorators: [
    (Story) => (
      <div className="flex w-80 justify-end">
        <Story />
      </div>
    )
  ],
  args: {
    onDebouncedChange: fn()
  }
} satisfies Meta<typeof PrSearchBar>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Expanded: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: "Buscar PRs" }));
    await userEvent.type(canvas.getByRole("searchbox", { name: "Filtrar PRs carregadas" }), "monitor");
  }
};
