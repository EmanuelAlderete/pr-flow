import { useEffect, useRef } from "react";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import {
  ContextMenu,
  ContextMenuCheckboxItem,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger
} from "./context-menu";

const meta = {
  title: "UI/ContextMenu",
  component: ContextMenu
} satisfies Meta<typeof ContextMenu>;

export default meta;

type Story = StoryObj<typeof meta>;

function OpenContextMenu() {
  const triggerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = triggerRef.current;
    if (!node) {
      return;
    }

    const rect = node.getBoundingClientRect();
    node.dispatchEvent(
      new MouseEvent("contextmenu", {
        bubbles: true,
        cancelable: true,
        clientX: rect.left + 24,
        clientY: rect.top + 24
      })
    );
  }, []);

  return (
    <div className="min-h-48">
      <ContextMenu open>
        <ContextMenuTrigger
          ref={triggerRef}
          className="inline-flex rounded-lg border border-dashed px-6 py-8 text-sm"
        >
          Clique com o botão direito
        </ContextMenuTrigger>
        <ContextMenuContent>
          <ContextMenuItem>Copiar link</ContextMenuItem>
          <ContextMenuItem>Abrir no GitHub</ContextMenuItem>
          <ContextMenuCheckboxItem checked>Fixar no topo</ContextMenuCheckboxItem>
          <ContextMenuSeparator />
          <ContextMenuItem variant="destructive">Remover</ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>
    </div>
  );
}

export const Default: Story = {
  render: () => <OpenContextMenu />
};
