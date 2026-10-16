import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { toast } from "sonner";

import { Button } from "./button";
import { Toaster } from "./sonner";

const meta = {
  title: "UI/Toaster",
  component: Toaster
} satisfies Meta<typeof Toaster>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <Button type="button" onClick={() => toast.success("Alterações salvas")}>
      Mostrar aviso
    </Button>
  )
};
