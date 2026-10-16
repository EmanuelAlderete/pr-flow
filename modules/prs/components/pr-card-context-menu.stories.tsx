import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, userEvent, within } from "storybook/test";

import type { MonitoredPr, PrLocalReviewInfo } from "@/modules/prs/lib/domain";

import { PrCardContextMenu } from "./pr-card-context-menu";

const openPr: MonitoredPr = {
  id: "PR_1284",
  number: 1284,
  title: "JOR-1234 Ajuste no monitor de pull requests",
  url: "https://github.com/jusfy/pr-flow/pull/1284",
  repository: "jusfy/pr-flow",
  createdAt: "2026-05-26T15:00:00.000Z",
  avaliou: ["ana"],
  naoAvaliou: ["bruno"],
  semReviewersSolicitados: false,
  aprovou: ["ana"],
  solicitouAlteracoes: [],
  pendente: ["bruno"],
  requestedReviewersCount: 2,
  statusGeral: "pending_review"
};

const runningReview: PrLocalReviewInfo = {
  status: "running",
  headSha: "abc1234",
  summary: null,
  findings: [],
  startedAt: "2026-05-28T11:00:00.000Z",
  finishedAt: null,
  error: null
};

async function openMenu(canvasElement: HTMLElement, itemName: string) {
  const canvas = within(canvasElement);
  const card = canvas.getByRole("article");
  const rect = card.getBoundingClientRect();
  const clientX = rect.left + Math.min(rect.width / 2, 48);
  const clientY = rect.top + rect.height / 2;

  await userEvent.pointer({
    keys: "[MouseRight]",
    target: card,
    coords: { x: clientX, y: clientY, clientX, clientY }
  });
  await within(document.body).findByRole("menuitem", { name: itemName });
}

const meta = {
  title: "PRs/PrCardContextMenu",
  component: PrCardContextMenu,
  decorators: [
    (Story) => (
      <div className="max-w-xl">
        <Story />
      </div>
    )
  ],
  args: {
    pr: {
      id: openPr.id,
      title: openPr.title,
      url: openPr.url,
      repository: openPr.repository,
      number: openPr.number,
      slackShare: null,
      localReview: null
    },
    jiraIssueKey: "JOR-1234",
    allOpenPrs: [openPr],
    statusClass: "status-changes",
    slackConfigured: false,
    children: (
      <div>
        <p className="pr-link">JOR-1234 Ajuste no monitor de pull requests</p>
        <p className="small muted">Clique com o botão direito no card para abrir o menu.</p>
      </div>
    )
  }
} satisfies Meta<typeof PrCardContextMenu>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Open: Story = {
  play: async ({ canvasElement }) => {
    await openMenu(canvasElement, "Copiar mensagem da PR");
    await within(document.body).findByRole("menuitem", { name: "Enviar ao Slack" });
    await within(document.body).findByRole("menuitem", { name: "Revisar agora" });
  }
};

export const SlackConfigured: Story = {
  args: {
    slackConfigured: true
  },
  play: async ({ canvasElement }) => {
    await openMenu(canvasElement, "Enviar ao Slack");
    await expect(
      within(document.body).queryByRole("menuitem", { name: "Copiar mensagem da PR" })
    ).toBeNull();
    await within(document.body).findByRole("menuitem", { name: "Revisar agora" });
  }
};

export const AlreadyShared: Story = {
  args: {
    slackConfigured: true,
    pr: {
      id: openPr.id,
      title: openPr.title,
      url: openPr.url,
      repository: openPr.repository,
      number: openPr.number,
      slackShare: {
        sharedAt: "2026-05-28T15:00:00.000Z",
        channel: "squad-jornada-pr"
      },
      localReview: null
    }
  },
  play: async ({ canvasElement }) => {
    await openMenu(canvasElement, "Reenviar ao Slack");
  }
};

export const ReviewRunning: Story = {
  args: {
    pr: {
      id: openPr.id,
      title: openPr.title,
      url: openPr.url,
      repository: openPr.repository,
      number: openPr.number,
      slackShare: null,
      localReview: runningReview
    }
  },
  play: async ({ canvasElement }) => {
    await openMenu(canvasElement, "Revisão local em andamento");
  }
};
