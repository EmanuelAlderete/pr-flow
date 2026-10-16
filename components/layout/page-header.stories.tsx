import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { Button } from "@/components/ui/button";

import { PageHeader } from "./page-header";

const meta = {
  title: "Layout/PageHeader",
  component: PageHeader,
  args: {
    title: "Pull requests",
    description: "Acompanhe as pull requests abertas nos repositórios monitorados."
  },
  render: (args) => (
    <PageHeader {...args} actions={<Button type="button">Atualizar</Button>} />
  )
} satisfies Meta<typeof PageHeader>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
