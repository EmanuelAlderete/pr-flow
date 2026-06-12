import { shiftNotebookDay } from "@/modules/journal/lib/notebook-day";
import type { WeeklyDaySnapshot } from "@/modules/summaries/lib/weekly-summary-context";
import { weekDayRange } from "@/modules/summaries/lib/summary-period";

export type WeeklyTotals = {
  reviewsGiven: number;
  reviewsReceived: number;
  tasksCompleted: number;
  jiraTicketsMoved: number;
  jiraTicketsClosed: number;
  jiraTicketsStillOpen: number;
  prsMerged: number;
  activeDays: number;
  openPrsOnLastDay: number;
};

export type WeeklyCarryOverTask = {
  title: string;
  isOverdue: boolean;
};

export type WeeklyCarryOver = {
  pendingTasks: WeeklyCarryOverTask[];
};

export type WeeklyDayActivity = {
  day: string;
  score: number;
};

function dayActivityScore(day: WeeklyDaySnapshot): number {
  let score = 0;
  if (day.context.noteBody?.trim()) {
    score += 1;
  }
  score += day.context.completedTodayTasks.length;
  score += day.context.pendingTasks.length > 0 ? 1 : 0;

  const jiraMoved = day.context.jira?.issues.filter((issue) => issue.updatedOnDay).length ?? 0;
  score += jiraMoved;

  const prs = day.context.prs;
  if (prs) {
    score += prs.reviewsGivenToday.length;
    score += prs.reviewsReceivedToday.length;
  }

  if (day.persistedSummary?.trim()) {
    score += 1;
  }

  return score;
}

export function computeWeeklyTotals(days: WeeklyDaySnapshot[]): WeeklyTotals {
  const movedJiraKeys = new Map<string, string>();

  let reviewsGiven = 0;
  let reviewsReceived = 0;
  let tasksCompleted = 0;
  let prsMerged = 0;
  let activeDays = 0;
  let openPrsOnLastDay = 0;

  for (const day of days) {
    if (dayActivityScore(day) > 0) {
      activeDays += 1;
    }

    tasksCompleted += day.context.completedTodayTasks.length;

    for (const issue of day.context.jira?.issues ?? []) {
      if (issue.updatedOnDay) {
        movedJiraKeys.set(issue.key, issue.statusCategoryKey);
      }
    }

    if (day.context.prs) {
      reviewsGiven += day.context.prs.reviewsGivenToday.length;
      reviewsReceived += day.context.prs.reviewsReceivedToday.length;
      prsMerged += day.context.prs.mergesToday?.length ?? 0;
    }
  }

  const lastDay = days.at(-1);
  openPrsOnLastDay = lastDay?.context.prs?.myOpenPrs.length ?? 0;

  let jiraTicketsClosed = 0;
  let jiraTicketsStillOpen = 0;
  for (const category of movedJiraKeys.values()) {
    if (category === "done") {
      jiraTicketsClosed += 1;
    } else {
      jiraTicketsStillOpen += 1;
    }
  }

  return {
    reviewsGiven,
    reviewsReceived,
    tasksCompleted,
    jiraTicketsMoved: movedJiraKeys.size,
    jiraTicketsClosed,
    jiraTicketsStillOpen,
    prsMerged,
    activeDays,
    openPrsOnLastDay
  };
}

export function computeWeeklyCarryOver(
  days: WeeklyDaySnapshot[],
  weekSunday: string
): WeeklyCarryOver {
  const lastSnapshot =
    days.find((snapshot) => snapshot.day === weekSunday) ?? days.at(-1);

  if (!lastSnapshot) {
    return { pendingTasks: [] };
  }

  return {
    pendingTasks: lastSnapshot.context.pendingTasks.map((task) => ({
      title: task.title,
      isOverdue: task.isOverdue ?? false
    }))
  };
}

export function computeWeeklyActivityByDay(
  days: WeeklyDaySnapshot[],
  weekMonday: string
): WeeklyDayActivity[] {
  const scoreByDay = new Map(days.map((day) => [day.day, dayActivityScore(day)]));

  return weekDayRange(weekMonday).map((day) => ({
    day,
    score: scoreByDay.get(day) ?? 0
  }));
}

export function previousWeekMonday(weekMonday: string): string {
  return shiftNotebookDay(weekMonday, -7);
}

export type WeeklyComparisonDelta = {
  metric: string;
  current: number;
  previous: number;
  delta: number;
};

export function buildWeeklyComparisonDeltas(
  current: WeeklyTotals,
  previous: WeeklyTotals | null
): WeeklyComparisonDelta[] {
  if (!previous) {
    return [];
  }

  const metrics: Array<{ key: keyof WeeklyTotals; label: string }> = [
    { key: "jiraTicketsClosed", label: "Tickets concluídos" },
    { key: "prsMerged", label: "PRs mescladas" },
    { key: "reviewsGiven", label: "Reviews realizados" },
    { key: "reviewsReceived", label: "Reviews recebidos" },
    { key: "tasksCompleted", label: "Tarefas concluídas" },
    { key: "jiraTicketsMoved", label: "Tickets Jira movimentados" },
    { key: "openPrsOnLastDay", label: "PRs abertas no fim da semana" },
    { key: "activeDays", label: "Dias com atividade" }
  ];

  return metrics.map(({ key, label }) => ({
    metric: label,
    current: current[key],
    previous: previous[key],
    delta: current[key] - previous[key]
  }));
}
