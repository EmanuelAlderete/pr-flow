import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { Button } from "./button";
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle, SheetTrigger } from "./sheet";

const meta = {
  title: "UI/Sheet",
  component: Sheet
} satisfies Meta<typeof Sheet>;

export default meta;

type Story = StoryObj<typeof meta>;

function OpenSheet({ side }: { side: "top" | "right" | "bottom" | "left" }) {
  return (
    <Sheet defaultOpen>
      <SheetTrigger render={<Button variant="outline" />}>Abrir painel</SheetTrigger>
      <SheetContent side={side}>
        <SheetHeader>
          <SheetTitle>Filtros</SheetTitle>
          <SheetDescription>Refine a lista de pull requests.</SheetDescription>
        </SheetHeader>
        <p className="px-4 text-sm text-muted-foreground">Status, repositório e autor.</p>
        <SheetFooter>
          <Button>Aplicar</Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

export const Default: Story = {
  render: () => <OpenSheet side="right" />
};

export const Left: Story = {
  render: () => <OpenSheet side="left" />
};

export const Top: Story = {
  render: () => <OpenSheet side="top" />
};

export const Bottom: Story = {
  render: () => <OpenSheet side="bottom" />
};
