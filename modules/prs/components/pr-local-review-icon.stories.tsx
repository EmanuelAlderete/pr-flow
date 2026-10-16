import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import type { PrLocalReviewInfo } from "@/modules/prs/lib/domain";

import { PrLocalReviewStatusIcon } from "./pr-local-review-icon";

const repository = "jusfy/pr-flow";
const prNumber = 1284;

function review(status: PrLocalReviewInfo["status"], extra?: Partial<PrLocalReviewInfo>): PrLocalReviewInfo {
  return {
    status,
    headSha: "abc1234",
    summary: status === "ok" ? "Nenhum problema bloqueante." : null,
    findings: [],
    startedAt: status === "running" ? "2026-05-28T11:00:00.000Z" : null,
    finishedAt: status === "running" ? null : "2026-05-28T12:00:00.000Z",
    error: status === "error" ? "A revisão foi interrompida antes de terminar." : null,
    ...extra
  };
}

const statuses: Array<{ label: string; review: PrLocalReviewInfo | null }> = [
  { label: "Sem revisão", review: null },
  { label: "Em andamento", review: review("running") },
  { label: "Concluída", review: review("ok") },
  { label: "Falhou", review: review("error") }
];

const meta = {
  title: "PRs/PrLocalReviewStatusIcon",
  component: PrLocalReviewStatusIcon,
  parameters: {
    nextjs: {
      appDirectory: true
    }
  },
  args: {
    repository,
    prNumber,
    review: review("ok")
  }
} satisfies Meta<typeof PrLocalReviewStatusIcon>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const AllStatuses: Story = {
  render: () => (
    <div className="flex flex-wrap items-end gap-8">
      {statuses.map((item) => (
        <div key={item.label} className="flex w-28 flex-col items-center gap-2 text-center">
          <div className="flex h-8 items-center justify-center">
            <PrLocalReviewStatusIcon repository={repository} prNumber={prNumber} review={item.review} />
          </div>
          <span className="text-xs text-[var(--app-text-muted)]">{item.label}</span>
        </div>
      ))}
    </div>
  )
};
