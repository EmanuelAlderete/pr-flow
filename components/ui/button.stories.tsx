import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { PlusIcon } from "lucide-react";

import { Button } from "./button";

const meta = {
  title: "UI/Button",
  component: Button,
  args: {
    children: "Salvar"
  },
  argTypes: {
    variant: {
      control: "select",
      options: ["default", "outline", "secondary", "ghost", "destructive", "link"]
    },
    size: {
      control: "select",
      options: ["default", "xs", "sm", "lg", "icon", "icon-xs", "icon-sm", "icon-lg"]
    }
  }
} satisfies Meta<typeof Button>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Outline: Story = {
  args: {
    variant: "outline",
    children: "Cancelar"
  }
};

export const Secondary: Story = {
  args: {
    variant: "secondary",
    children: "Salvar"
  }
};

export const Ghost: Story = {
  args: {
    variant: "ghost",
    children: "Cancelar"
  }
};

export const Destructive: Story = {
  args: {
    variant: "destructive",
    children: "Excluir"
  }
};

export const Link: Story = {
  args: {
    variant: "link",
    children: "Abrir"
  }
};

export const Sizes: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-3">
      <Button size="xs">Salvar</Button>
      <Button size="sm">Salvar</Button>
      <Button size="default">Salvar</Button>
      <Button size="lg">Salvar</Button>
      <Button size="icon-xs" aria-label="Adicionar">
        <PlusIcon />
      </Button>
      <Button size="icon-sm" aria-label="Adicionar">
        <PlusIcon />
      </Button>
      <Button size="icon" aria-label="Adicionar">
        <PlusIcon />
      </Button>
      <Button size="icon-lg" aria-label="Adicionar">
        <PlusIcon />
      </Button>
    </div>
  )
};
