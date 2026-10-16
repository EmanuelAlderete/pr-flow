import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import type { WeeklyTotals } from "@/modules/summaries/lib/weekly-summary-aggregates";
import type { WeeklyComparisonResult } from "@/modules/summaries/lib/weekly-summary-comparison-service";

import { WeeklyComparisonPanel } from "./weekly-comparison-panel";

const zeroTotals: WeeklyTotals = {
  reviewsGiven: 0,
  reviewsReceived: 0,
  tasksCompleted: 0,
  jiraTicketsMoved: 0,
  jiraTicketsClosed: 0,
  jiraTicketsStillOpen: 0,
  prsMerged: 0,
  activeDays: 0,
  openPrsOnLastDay: 0
};

const filledComparison: WeeklyComparisonResult = {
  weekMonday: "2026-10-12",
  previousWeekMonday: "2026-10-05",
  hasPreviousWeekSummary: true,
  totals: {
    reviewsGiven: 6,
    reviewsReceived: 3,
    tasksCompleted: 4,
    jiraTicketsMoved: 5,
    jiraTicketsClosed: 2,
    jiraTicketsStillOpen: 3,
    prsMerged: 2,
    activeDays: 4,
    openPrsOnLastDay: 1
  },
  previousTotals: {
    reviewsGiven: 4,
    reviewsReceived: 3,
    tasksCompleted: 6,
    jiraTicketsMoved: 3,
    jiraTicketsClosed: 1,
    jiraTicketsStillOpen: 4,
    prsMerged: 1,
    activeDays: 5,
    openPrsOnLastDay: 2
  },
  deltas: [
    { metric: "Tickets concluídos", current: 2, previous: 1, delta: 1 },
    { metric: "PRs mescladas", current: 2, previous: 1, delta: 1 },
    { metric: "Reviews realizados", current: 6, previous: 4, delta: 2 },
    { metric: "Reviews recebidos", current: 3, previous: 3, delta: 0 },
    { metric: "Tarefas concluídas", current: 4, previous: 6, delta: -2 },
    { metric: "Dias com atividade", current: 4, previous: 5, delta: -1 }
  ],
  activityByDay: [
    { day: "2026-10-12", score: 3 },
    { day: "2026-10-13", score: 5 },
    { day: "2026-10-14", score: 1 },
    { day: "2026-10-15", score: 4 },
    { day: "2026-10-16", score: 2 },
    { day: "2026-10-17", score: 0 },
    { day: "2026-10-18", score: 0 }
  ],
  carryOverTaskCount: 2
};

const emptyComparison: WeeklyComparisonResult = {
  weekMonday: "2026-10-12",
  previousWeekMonday: "2026-10-05",
  hasPreviousWeekSummary: false,
  totals: zeroTotals,
  previousTotals: null,
  deltas: [],
  activityByDay: [
    { day: "2026-10-12", score: 1 },
    { day: "2026-10-13", score: 0 },
    { day: "2026-10-14", score: 2 },
    { day: "2026-10-15", score: 0 },
    { day: "2026-10-16", score: 0 },
    { day: "2026-10-17", score: 0 },
    { day: "2026-10-18", score: 0 }
  ],
  carryOverTaskCount: 0
};

const meta = {
  title: "Summaries/WeeklyComparisonPanel",
  component: WeeklyComparisonPanel,
  args: {
    comparison: filledComparison
  },
  decorators: [
    (Story) => (
      <div className="max-w-xl">
        <Story />
      </div>
    )
  ]
} satisfies Meta<typeof WeeklyComparisonPanel>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Empty: Story = {
  args: {
    comparison: emptyComparison
  }
};
