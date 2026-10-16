import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import type { SummaryDto } from "@/modules/summaries/lib/domain";
import type { WeeklyComparisonResult } from "@/modules/summaries/lib/weekly-summary-comparison-service";

import { SummariesPage } from "./summaries-page";

const weeklyComparison: WeeklyComparisonResult = {
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

const filledSummaries: SummaryDto[] = [
  {
    id: "summary-week",
    type: "weekly",
    periodKey: "2026-10-12",
    content: [
      "## Semana",
      "",
      "A semana fechou com mais reviews do que a anterior. Duas tarefas seguem abertas para a próxima segunda.",
      "",
      "- Alertas de pull request configurados.",
      "- Caderno preenchido em quatro dias."
    ].join("\n"),
    generatedAt: "2026-10-16T08:00:00.000Z"
  },
  {
    id: "summary-day",
    type: "daily",
    periodKey: "2026-10-15",
    content: [
      "## O que avançou",
      "",
      "Fechei a revisão das notificações e deixei o caderno do dia em dia.",
      "",
      "## Pendências",
      "",
      "- Conferir a fila de review antes do fim da tarde."
    ].join("\n"),
    generatedAt: "2026-10-16T00:05:00.000Z"
  }
];

function requestUrl(input: RequestInfo | URL): string {
  if (typeof input === "string") {
    return input;
  }
  if (input instanceof URL) {
    return input.href;
  }
  return input.url;
}

function installSummariesFetch(summaries: SummaryDto[]): () => void {
  const original = globalThis.fetch;
  globalThis.fetch = async (input: RequestInfo | URL) => {
    const url = new URL(requestUrl(input), "http://storybook.local");

    if (url.pathname.includes("/api/summaries/weekly-comparison")) {
      return Response.json(weeklyComparison);
    }

    if (url.pathname.includes("/api/summaries")) {
      const type = url.searchParams.get("type");
      const filtered =
        type === "daily" || type === "weekly"
          ? summaries.filter((summary) => summary.type === type)
          : summaries;
      return Response.json({ summaries: filtered });
    }

    return Response.json({ summaries: [] });
  };

  return () => {
    globalThis.fetch = original;
  };
}

const meta = {
  title: "Summaries/SummariesPage",
  component: SummariesPage,
  decorators: [
    (Story) => (
      <div className="mx-auto max-w-5xl">
        <Story />
      </div>
    )
  ]
} satisfies Meta<typeof SummariesPage>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Empty: Story = {
  beforeEach: () => installSummariesFetch([])
};

export const Filled: Story = {
  beforeEach: () => installSummariesFetch(filledSummaries)
};
