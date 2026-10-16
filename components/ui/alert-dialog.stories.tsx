import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger
} from "./alert-dialog";
import { Button } from "./button";

const meta = {
  title: "UI/AlertDialog",
  component: AlertDialog
} satisfies Meta<typeof AlertDialog>;

export default meta;

type Story = StoryObj<typeof meta>;

function RemoveTaskDialog({ size = "default" }: { size?: "default" | "sm" }) {
  return (
    <AlertDialog defaultOpen>
      <AlertDialogTrigger render={<Button variant="destructive" />}>Excluir tarefa</AlertDialogTrigger>
      <AlertDialogContent size={size}>
        <AlertDialogHeader>
          <AlertDialogTitle>Remover tarefa</AlertDialogTitle>
          <AlertDialogDescription>
            Remover a tarefa &quot;Revisar pull request&quot;? Esta ação não pode ser desfeita.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction variant="destructive">Remover</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export const Default: Story = {
  render: () => <RemoveTaskDialog />
};

export const Small: Story = {
  render: () => <RemoveTaskDialog size="sm" />
};
