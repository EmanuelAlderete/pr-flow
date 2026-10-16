import { sb } from "storybook/test";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import type { DashboardBriefingResponse } from "@/modules/dashboard/lib/dashboard-briefing-types";
import {
  clearDashboardBriefingCache,
  clearDashboardHubStatsCache
} from "@/modules/dashboard/lib/dashboard-widget-cache";
import type { DayCalendarResponse } from "@/modules/day-calendar/lib/day-calendar-validation";
import type { JiraIssueDto, JiraIssuesResponse, JiraSprintsResponse } from "@/modules/jira/lib/domain";
import {
  buildJournalStreak,
  isWeekdayNotebookDay,
  previousWeekdayNotebookDay,
  type JournalStreakSnapshot
} from "@/modules/journal/lib/journal-streak";
import { shiftNotebookDay, todayLocalDateString } from "@/modules/journal/lib/notebook-day";
import type { PrApiSuccess, ReviewerQueueApiSuccess } from "@/modules/prs/lib/domain";
import {
  clearShortcutDeck,
  saveShortcutDeck,
  SHORTCUT_DECK_STORAGE_KEY,
  SHORTCUT_DECK_UPDATED_EVENT
} from "@/modules/shortcut-deck/lib/shortcut-deck-storage";
import type { ShortcutDeckStored } from "@/modules/shortcut-deck/lib/shortcut-deck-validation";
import { previousBusinessDay } from "@/modules/summaries/lib/summary-period";
import type { OpenTaskDto, TaskListResponse } from "@/modules/tasks/lib/domain";
import {
  clearVacationCountdown,
  saveVacationCountdown,
  VACATION_COUNTDOWN_STORAGE_KEY,
  VACATION_COUNTDOWN_UPDATED_EVENT
} from "@/modules/vacation-countdown/lib/vacation-countdown-storage";

import { DashboardPage } from "./dashboard-page";

sb.mock(import("@/modules/llm-generation"), { spy: true });

const today = todayLocalDateString();
const yesterday = shiftNotebookDay(today, -1);
const fetchedAt = `${today}T12:00:00.000Z`;

const deckFixture: ShortcutDeckStored = {
  shortcuts: [
    {
      id: "atalho-slack",
      label: "Slack do time",
      url: "https://jusfy.slack.com",
      iconId: "slack",
      colorId: "violet",
      sortOrder: 0
    },
    {
      id: "atalho-jira",
      label: "Jira",
      url: "https://jusfy.atlassian.net/jira",
      iconId: "jira",
      colorId: "sky",
      sortOrder: 1
    },
    {
      id: "atalho-prs",
      label: "Pull requests",
      url: "/prs",
      iconId: "github",
      colorId: "ember",
      sortOrder: 2
    }
  ]
};

function localIsoDate(offsetDays: number): string {
  const date = new Date();
  date.setHours(12, 0, 0, 0);
  date.setDate(date.getDate() + offsetDays);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function notedWeekdays(count: number): string[] {
  const days: string[] = [];
  let cursor = isWeekdayNotebookDay(today) ? today : previousWeekdayNotebookDay(today);
  while (days.length < count) {
    days.push(cursor);
    cursor = previousWeekdayNotebookDay(cursor);
  }
  return days;
}

function openTask(id: string, title: string, dueDate: string | null, isOverdue: boolean): OpenTaskDto {
  return {
    id,
    title,
    description: null,
    dueDate,
    completedAt: null,
    createdAt: "2026-10-10T12:00:00.000Z",
    updatedAt: fetchedAt,
    isOverdue
  };
}

const filledTasks: TaskListResponse = {
  open: [
    openTask("tarefa-1", "Revisar a PR do faturamento", yesterday, true),
    openTask("tarefa-2", "Responder o comentário no Jira", shiftNotebookDay(today, 1), false),
    openTask("tarefa-3", "Atualizar o journal de hoje", null, false)
  ],
  completed: []
};

const emptyTasks: TaskListResponse = { open: [], completed: [] };

const filledStreak: JournalStreakSnapshot = buildJournalStreak({
  today,
  daysWithNote: notedWeekdays(4)
});

const emptyStreak: JournalStreakSnapshot = buildJournalStreak({
  today,
  daysWithNote: []
});

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
    }
  ]
};

const emptyCalendar: DayCalendarResponse = {
  status: "ok",
  day: today,
  timeZone: "America/Sao_Paulo",
  events: []
};

const filledBriefing: DashboardBriefingResponse = {
  status: "ok",
  day: today,
  previousBusinessDay: previousBusinessDay(today),
  summary: [
    "## Fechamento de ontem",
    "",
    "A revisão da PR de faturamento ficou pendente e o ticket da sprint avançou para em andamento.",
    "",
    "## Foco de hoje",
    "",
    "Fechar o deck de atalhos e atualizar o briefing do dash."
  ].join("\n"),
  generatedAt: fetchedAt
};

const waitingBriefing: DashboardBriefingResponse = {
  status: "not_generated",
  day: today,
  previousBusinessDay: previousBusinessDay(today)
};

const sprintsResponse: JiraSprintsResponse = {
  boardId: 12,
  boardName: "Engenharia",
  projectKey: "JUS",
  sprints: [
    {
      id: 42,
      name: "Sprint 42",
      state: "active",
      startDate: "2026-10-06T00:00:00.000Z",
      endDate: "2026-10-17T00:00:00.000Z"
    }
  ],
  cachedAt: fetchedAt
};

function jiraIssue(key: string, summary: string): JiraIssueDto {
  return {
    key,
    summary,
    statusName: "Em andamento",
    statusCategoryKey: "indeterminate",
    issueTypeName: "Tarefa",
    priorityName: "Alta",
    updated: fetchedAt,
    browseUrl: `https://jira.example/browse/${key}`
  };
}

function issuesResponse(issues: JiraIssueDto[]): JiraIssuesResponse {
  return {
    email: "dev@example.com",
    displayName: null,
    sprintFilter: "42",
    issues,
    cachedAt: fetchedAt
  };
}

const filledIssues = issuesResponse([
  jiraIssue("JUS-120", "Ajustar a contagem de férias"),
  jiraIssue("JUS-128", "Revisar o filtro da sprint"),
  jiraIssue("JUS-131", "Atualizar o briefing do dash")
]);

function prsResponse(count: number): PrApiSuccess {
  const titles = [
    "Corrigir filtro da sprint",
    "Ajustar contagem de férias",
    "Documentar atalhos",
    "Atualizar o briefing"
  ];
  return {
    status: "ok",
    fetchedAt,
    githubLogin: "dev",
    data: Array.from({ length: count }, (_, index) => {
      const number = 410 + index;
      return {
        id: `pr-${number}`,
        number,
        title: titles[index] ?? `PR ${number}`,
        url: `https://github.com/jusfy/app/pull/${number}`,
        repository: "jusfy/app",
        createdAt: "2026-10-14T14:00:00.000Z",
        avaliou: [],
        naoAvaliou: ["dev"],
        semReviewersSolicitados: false,
        aprovou: [],
        solicitouAlteracoes: [],
        pendente: ["dev"],
        requestedReviewersCount: 1,
        statusGeral: "pending_review",
        slackShare: null,
        localReview: null
      };
    })
  };
}

function reviewerQueue(pending: number): ReviewerQueueApiSuccess {
  return {
    status: "ok",
    fetchedAt,
    githubLogin: "dev",
    data: Array.from({ length: pending }, (_, index) => ({
      id: `fila-${index + 1}`,
      number: 418 + index,
      title: index === 0 ? "Corrigir filtro da sprint" : "Atualizar o briefing do dash",
      url: `https://github.com/jusfy/app/pull/${418 + index}`,
      repository: "jusfy/app",
      myReviewStatus: "pending" as const
    }))
  };
}

function requestUrl(input: RequestInfo | URL): string {
  if (typeof input === "string") {
    return input;
  }
  if (input instanceof URL) {
    return input.href;
  }
  return input.url;
}

function clearWidgetSession(): void {
  clearDashboardHubStatsCache();
  clearDashboardBriefingCache(today);
  const prefixes = ["pr-flow:dashboard-briefing-v1:", "pr-flow:dashboard-daily-summary-v1:"];
  const keys: string[] = [];
  for (let index = 0; index < sessionStorage.length; index += 1) {
    const key = sessionStorage.key(index);
    if (key && prefixes.some((prefix) => key.startsWith(prefix))) {
      keys.push(key);
    }
  }
  for (const key of keys) {
    sessionStorage.removeItem(key);
  }
}

function rememberLocalStorage(key: string): () => void {
  const previous = window.localStorage.getItem(key);
  return () => {
    if (previous === null) {
      window.localStorage.removeItem(key);
    } else {
      window.localStorage.setItem(key, previous);
    }
  };
}

function installPageState(mode: "filled" | "empty"): () => void {
  clearWidgetSession();
  const originalFetch = globalThis.fetch;
  const restoreVacation = rememberLocalStorage(VACATION_COUNTDOWN_STORAGE_KEY);
  const restoreShortcuts = rememberLocalStorage(SHORTCUT_DECK_STORAGE_KEY);

  if (mode === "filled") {
    saveVacationCountdown({ startDate: localIsoDate(12), promptDismissed: true });
    saveShortcutDeck(deckFixture);
  } else {
    clearVacationCountdown();
    clearShortcutDeck();
  }

  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = requestUrl(input);
    if (url.includes("/api/tasks/") && init?.method === "PATCH") {
      return Response.json({ ok: true });
    }
    if (url.includes("/api/journal/streak")) {
      return Response.json(mode === "filled" ? filledStreak : emptyStreak);
    }
    if (url.includes("/api/dashboard/calendar-today")) {
      return Response.json(mode === "filled" ? filledCalendar : emptyCalendar);
    }
    if (url.includes("/api/dashboard/briefing")) {
      return Response.json(mode === "filled" ? filledBriefing : waitingBriefing);
    }
    if (url.includes("/api/prs/reviewer-queue")) {
      return Response.json(reviewerQueue(mode === "filled" ? 2 : 0));
    }
    if (url.includes("/api/prs")) {
      return Response.json(prsResponse(mode === "filled" ? 4 : 0));
    }
    if (url.includes("/api/tasks")) {
      return Response.json(mode === "filled" ? filledTasks : emptyTasks);
    }
    if (url.includes("/api/jira/sprints")) {
      return Response.json(sprintsResponse);
    }
    if (url.includes("/api/jira/issues")) {
      return Response.json(mode === "filled" ? filledIssues : issuesResponse([]));
    }
    return Response.json({ message: "Not mocked" }, { status: 404 });
  }) as typeof fetch;

  return () => {
    globalThis.fetch = originalFetch;
    clearWidgetSession();
    restoreShortcuts();
    restoreVacation();
    window.dispatchEvent(new Event(SHORTCUT_DECK_UPDATED_EVENT));
    window.dispatchEvent(new Event(VACATION_COUNTDOWN_UPDATED_EVENT));
  };
}

const meta = {
  title: "Dashboard/DashboardPage",
  component: DashboardPage,
  parameters: {
    nextjs: {
      appDirectory: true
    }
  },
  decorators: [
    (Story) => (
      <div className="mx-auto w-full max-w-6xl">
        <Story />
      </div>
    )
  ],
  beforeEach: () => installPageState("filled")
} satisfies Meta<typeof DashboardPage>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Empty: Story = {
  beforeEach: () => installPageState("empty")
};
