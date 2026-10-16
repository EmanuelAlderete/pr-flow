import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { WorkContextProvider } from "@/modules/work-context/components/work-context-provider";
import type { MonitoredPr, PrLocalReviewInfo } from "@/modules/prs/lib/domain";

import { PrCard } from "./pr-card";

function daysAgo(days: number): string {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
}

function monitoredPr(overrides: Partial<MonitoredPr> = {}): MonitoredPr {
  return {
    id: "PR_1284",
    number: 1284,
    title: "JOR-1234 Ajuste no monitor de pull requests",
    url: "https://github.com/jusfy/pr-flow/pull/1284",
    repository: "jusfy/pr-flow",
    createdAt: daysAgo(2),
    avaliou: ["ana"],
    naoAvaliou: ["bruno"],
    semReviewersSolicitados: false,
    aprovou: ["ana"],
    solicitouAlteracoes: [],
    pendente: ["bruno"],
    requestedReviewersCount: 2,
    statusGeral: "pending_review",
    ...overrides
  };
}

function localReview(status: PrLocalReviewInfo["status"]): PrLocalReviewInfo {
  return {
    status,
    headSha: "abc1234",
    summary: status === "ok" ? "Um null esquecido no retry." : null,
    findings:
      status === "ok"
        ? [
            {
              agent: "correctness",
              path: "src/retry.ts",
              line: 12,
              message: "retry ignora null",
              confidence: 0.91
            }
          ]
        : [],
    startedAt: status === "running" ? new Date(Date.now() - 65_000).toISOString() : null,
    finishedAt: status === "running" ? null : "2026-05-28T12:00:00.000Z",
    error: status === "error" ? "A revisão foi interrompida antes de terminar." : null
  };
}

const pendingPr = monitoredPr();

const meta = {
  title: "PRs/PrCard",
  component: PrCard,
  decorators: [
    (Story) => (
      <WorkContextProvider>
        <div className="max-w-3xl">
          <Story />
        </div>
      </WorkContextProvider>
    )
  ],
  parameters: {
    nextjs: {
      appDirectory: true
    }
  },
  args: {
    pr: pendingPr,
    allOpenPrs: [pendingPr]
  }
} satisfies Meta<typeof PrCard>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Approved: Story = {
  args: {
    pr: monitoredPr({
      statusGeral: "approved",
      avaliou: ["ana", "bruno"],
      naoAvaliou: [],
      aprovou: ["ana", "bruno"],
      pendente: [],
      requestedReviewersCount: 2
    })
  }
};

export const ChangesRequested: Story = {
  args: {
    pr: monitoredPr({
      statusGeral: "changes_requested",
      solicitouAlteracoes: ["marcos"]
    })
  }
};

export const Impediments: Story = {
  args: {
    pr: monitoredPr({
      statusGeral: "changes_requested",
      solicitouAlteracoes: ["marcos"],
      hasConflicts: true,
      hasUnresolvedComments: true
    })
  }
};

export const ApprovedWithConflict: Story = {
  args: {
    pr: monitoredPr({
      statusGeral: "approved",
      readyToMerge: false,
      hasConflicts: true,
      avaliou: ["ana", "bruno", "carla"],
      naoAvaliou: [],
      aprovou: ["ana", "bruno", "carla"],
      pendente: [],
      requestedReviewersCount: 3
    })
  }
};

export const NoReviewers: Story = {
  args: {
    pr: monitoredPr({
      title: "Ajuste sem ticket no título",
      semReviewersSolicitados: true,
      avaliou: [],
      naoAvaliou: [],
      aprovou: [],
      solicitouAlteracoes: [],
      pendente: [],
      requestedReviewersCount: 0,
      statusGeral: "no_reviewers"
    })
  }
};

export const ReadyToMerge: Story = {
  args: {
    pr: monitoredPr({
      statusGeral: "approved",
      readyToMerge: true,
      avaliou: ["ana", "bruno"],
      naoAvaliou: [],
      aprovou: ["ana", "bruno"],
      pendente: [],
      requestedReviewersCount: 2
    })
  }
};

export const SharedOnSlack: Story = {
  args: {
    pr: monitoredPr({
      slackShare: {
        sharedAt: "2026-05-28T15:00:00.000Z",
        channel: "squad-jornada-pr"
      }
    })
  }
};

export const LocalReviewRunning: Story = {
  args: {
    pr: monitoredPr({
      localReview: localReview("running")
    })
  }
};

export const LocalReviewReady: Story = {
  args: {
    pr: monitoredPr({
      localReview: localReview("ok")
    })
  }
};
