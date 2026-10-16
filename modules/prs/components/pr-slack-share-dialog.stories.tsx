import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fn } from "storybook/test";

import type { SlackRelatedPr } from "@/modules/prs/lib/core/pr-slack-related";

import { PrSlackShareDialog } from "./pr-slack-share-dialog";

const currentPrUrl = "https://github.com/jusfy/api/pull/128";

const relatedPrs: SlackRelatedPr[] = [
  {
    id: "PR_128",
    number: 128,
    title: "JOR-418 — Ajustar a fila de revisão",
    url: currentPrUrl,
    repository: "jusfy/api",
    slackShare: null
  },
  {
    id: "PR_96",
    number: 96,
    title: "JOR-418 — Extrair o resumo da revisão local",
    url: "https://github.com/jusfy/web/pull/96",
    repository: "jusfy/web",
    slackShare: {
      sharedAt: "2026-10-15T18:00:00.000Z",
      channel: "squad-jornada-pr"
    }
  }
];

const meta = {
  title: "PRs/PrSlackShareDialog",
  component: PrSlackShareDialog,
  args: {
    open: true,
    issueKey: "JOR-418",
    currentPrUrl,
    relatedPrs,
    loading: false,
    onOpenChange: fn(),
    onConfirm: fn()
  }
} satisfies Meta<typeof PrSlackShareDialog>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Open: Story = {};

export const Default: Story = {};

export const Loading: Story = {
  args: {
    loading: true
  }
};
