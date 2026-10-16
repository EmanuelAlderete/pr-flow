import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import type { PrImpediment } from "@/modules/prs/lib/core/pr-impediments";

import { PrAlertIcons } from "./pr-alert-icons";

const allImpediments: PrImpediment[] = [
  {
    key: "sufficient-approvals",
    label: "Já possui aprovações suficientes",
    icon: "sufficient-approvals",
    tone: "danger"
  },
  {
    key: "conflicts",
    label: "Conflitos detectados",
    icon: "conflicts",
    tone: "danger"
  },
  {
    key: "unresolved-comments",
    label: "Comentários não resolvidos",
    icon: "unresolved-comments",
    tone: "danger"
  },
  {
    key: "changes-requested",
    label: "Alterações solicitadas por marcos",
    icon: "changes-requested",
    tone: "danger"
  },
  {
    key: "pending-reviews",
    label: "2 revisões pendentes",
    icon: "pending-reviews",
    tone: "danger"
  },
  {
    key: "pending-review",
    label: "Revisão pendente para seguir com merge",
    icon: "pending-review",
    tone: "danger"
  }
];

const meta = {
  title: "PRs/PrAlertIcons",
  component: PrAlertIcons,
  args: {
    impediments: allImpediments
  }
} satisfies Meta<typeof PrAlertIcons>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Empty: Story = {
  args: {
    impediments: []
  }
};
