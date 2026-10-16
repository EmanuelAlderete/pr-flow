import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import {
  buildJournalStreak,
  isWeekdayNotebookDay,
  previousWeekdayNotebookDay,
  type JournalStreakSnapshot
} from "@/modules/journal/lib/journal-streak";
import { todayLocalDateString } from "@/modules/journal/lib/notebook-day";

import { DashboardJournalStreakWidget } from "./dashboard-journal-streak-widget";

const today = todayLocalDateString();

function recentNotedWeekdays(count: number): string[] {
  const days: string[] = [];
  let cursor = isWeekdayNotebookDay(today) ? today : previousWeekdayNotebookDay(today);
  while (days.length < count) {
    days.push(cursor);
    cursor = previousWeekdayNotebookDay(cursor);
  }
  return days;
}

const filledStreak: JournalStreakSnapshot = buildJournalStreak({
  today,
  daysWithNote: recentNotedWeekdays(4)
});

const emptyStreak: JournalStreakSnapshot = buildJournalStreak({
  today,
  daysWithNote: []
});

function requestUrl(input: RequestInfo | URL): string {
  if (typeof input === "string") {
    return input;
  }
  if (input instanceof URL) {
    return input.href;
  }
  return input.url;
}

function json(body: unknown, status = 200): Response {
  return Response.json(body, { status });
}

function installFetch(body: JournalStreakSnapshot | "error" | "pending"): () => void {
  const original = globalThis.fetch;
  globalThis.fetch = (async (input: RequestInfo | URL) => {
    if (body === "pending") {
      return new Promise<Response>(() => undefined);
    }
    const url = requestUrl(input);
    if (!url.includes("/api/journal/streak")) {
      return json({ message: "Not mocked" }, 404);
    }
    if (body === "error") {
      return json({ message: "Falha ao carregar o streak." }, 500);
    }
    return json(body);
  }) as typeof fetch;

  return () => {
    globalThis.fetch = original;
  };
}

const meta = {
  title: "Dashboard/DashboardJournalStreakWidget",
  component: DashboardJournalStreakWidget,
  parameters: {
    nextjs: {
      appDirectory: true
    }
  },
  decorators: [
    (Story) => (
      <div className="max-w-xl">
        <Story />
      </div>
    )
  ],
  beforeEach: () => installFetch(filledStreak)
} satisfies Meta<typeof DashboardJournalStreakWidget>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Empty: Story = {
  beforeEach: () => installFetch(emptyStreak)
};

export const Error: Story = {
  beforeEach: () => installFetch("error")
};

export const Loading: Story = {
  beforeEach: () => installFetch("pending")
};
