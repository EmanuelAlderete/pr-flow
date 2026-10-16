import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import type { DayCalendarResponse } from "@/modules/day-calendar/lib/day-calendar-validation";
import { todayLocalDateString } from "@/modules/journal/lib/notebook-day";
import { ptBR } from "@/modules/messages/pt-BR";

import { DashboardDayCalendarWidget } from "./dashboard-day-calendar-widget";

const today = todayLocalDateString();

function atUtc(hours: number, minutes: number): string {
  return `${today}T${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:00.000Z`;
}

const filledCalendar: DayCalendarResponse = {
  status: "ok",
  day: today,
  timeZone: "America/Sao_Paulo",
  events: [
    {
      uid: "evento-daily",
      title: "Daily do time",
      startsAt: atUtc(12, 0),
      endsAt: atUtc(12, 15),
      allDay: false,
      location: null
    },
    {
      uid: "evento-produto",
      title: "Revisão de produto",
      startsAt: atUtc(15, 0),
      endsAt: atUtc(16, 0),
      allDay: false,
      location: "Sala Jornada"
    },
    {
      uid: "evento-folga",
      title: "Foco sem reuniões",
      startsAt: atUtc(3, 0),
      endsAt: atUtc(3, 0),
      allDay: true,
      location: null
    }
  ]
};

const emptyCalendar: DayCalendarResponse = {
  status: "ok",
  day: today,
  timeZone: "America/Sao_Paulo",
  events: []
};

const missingConfig: DayCalendarResponse = {
  status: "missing_config",
  message: ptBR.dayCalendar.missingConfig
};

const calendarError: DayCalendarResponse = {
  status: "error",
  message: ptBR.dayCalendar.loadFailed
};

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

function installFetch(body: DayCalendarResponse | "pending", status = 200): () => void {
  const original = globalThis.fetch;
  globalThis.fetch = (async (input: RequestInfo | URL) => {
    if (body === "pending") {
      return new Promise<Response>(() => undefined);
    }
    const url = requestUrl(input);
    if (url.includes("/api/dashboard/calendar-today")) {
      return json(body, status);
    }
    return json({ message: "Not mocked" }, 404);
  }) as typeof fetch;

  return () => {
    globalThis.fetch = original;
  };
}

const meta = {
  title: "Dashboard/DashboardDayCalendarWidget",
  component: DashboardDayCalendarWidget,
  decorators: [
    (Story) => (
      <div className="max-w-md">
        <Story />
      </div>
    )
  ],
  beforeEach: () => installFetch(filledCalendar)
} satisfies Meta<typeof DashboardDayCalendarWidget>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Empty: Story = {
  beforeEach: () => installFetch(emptyCalendar)
};

export const MissingConfig: Story = {
  beforeEach: () => installFetch(missingConfig, 503)
};

export const Error: Story = {
  beforeEach: () => installFetch(calendarError, 400)
};

export const Loading: Story = {
  beforeEach: () => installFetch("pending")
};
