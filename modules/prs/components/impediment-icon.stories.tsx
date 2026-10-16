import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import type { ImpedimentIconKind } from "@/modules/prs/lib/core/pr-impediments";

import { ImpedimentIcon } from "./impediment-icon";

const kinds: Array<{ kind: ImpedimentIconKind; label: string }> = [
  { kind: "conflicts", label: "Conflitos detectados" },
  { kind: "unresolved-comments", label: "Comentários não resolvidos" },
  { kind: "changes-requested", label: "Alterações solicitadas" },
  { kind: "pending-reviews", label: "Revisões pendentes" },
  { kind: "pending-review", label: "Revisão pendente" },
  { kind: "sufficient-approvals", label: "Aprovações suficientes" }
];

const meta = {
  title: "PRs/ImpedimentIcon",
  component: ImpedimentIcon,
  args: {
    kind: "conflicts"
  }
} satisfies Meta<typeof ImpedimentIcon>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const AllKinds: Story = {
  render: () => (
    <div className="flex flex-wrap items-end gap-6 text-[var(--app-text)]">
      {kinds.map((item) => (
        <div key={item.kind} className="flex w-28 flex-col items-center gap-2 text-center">
          <ImpedimentIcon kind={item.kind} />
          <span className="text-xs text-[var(--app-text-muted)]">{item.label}</span>
        </div>
      ))}
    </div>
  )
};
