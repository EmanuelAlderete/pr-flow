import type { JiraIssuesResponse, JiraSprintsResponse } from "@/modules/jira/lib/domain";
import { resolveDefaultSprintFilter } from "@/modules/jira/lib/jira-sprint-filter";
import type { ReviewerQueueApiResponse } from "@/modules/prs/lib/domain";
import type { TaskListResponse } from "@/modules/tasks/lib/domain";

export type DashboardHubStats = {
  openPrs: number | null;
  openTasks: number | null;
  overdueTasks: number | null;
  pendingReviews: number | null;
  jiraSprintTickets: number | null;
  jiraSprintLabel: string | null;
};

export const emptyDashboardHubStats: DashboardHubStats = {
  openPrs: null,
  openTasks: null,
  overdueTasks: null,
  pendingReviews: null,
  jiraSprintTickets: null,
  jiraSprintLabel: null
};

async function fetchJiraSprintStats(
  signal?: AbortSignal
): Promise<Pick<DashboardHubStats, "jiraSprintTickets" | "jiraSprintLabel">> {
  const sprintsRes = await fetch("/api/jira/sprints", { signal, cache: "no-store" });
  if (sprintsRes.status === 503) {
    return { jiraSprintTickets: null, jiraSprintLabel: null };
  }
  if (!sprintsRes.ok) {
    return { jiraSprintTickets: null, jiraSprintLabel: null };
  }

  const sprintsBody = (await sprintsRes.json()) as JiraSprintsResponse;
  const sprintFilter = resolveDefaultSprintFilter(sprintsBody.sprints);
  if (sprintFilter === "all") {
    return { jiraSprintTickets: 0, jiraSprintLabel: null };
  }

  const activeSprint = sprintsBody.sprints.find((sprint) => sprint.state === "active");
  const sprintLabel = activeSprint?.name ?? null;

  const params = new URLSearchParams({ sprint: sprintFilter });
  const issuesRes = await fetch(`/api/jira/issues?${params}`, { signal, cache: "no-store" });
  if (!issuesRes.ok) {
    return { jiraSprintTickets: null, jiraSprintLabel: sprintLabel };
  }

  const issuesBody = (await issuesRes.json()) as JiraIssuesResponse;
  return {
    jiraSprintTickets: issuesBody.issues.length,
    jiraSprintLabel: sprintLabel
  };
}

export async function fetchDashboardHubStats(
  signal?: AbortSignal
): Promise<DashboardHubStats> {
  const [prsRes, tasksRes, reviewerQueueRes, jiraStats] = await Promise.all([
    fetch("/api/prs", { signal, cache: "no-store" }),
    fetch("/api/tasks", { signal, cache: "no-store" }),
    fetch("/api/prs/reviewer-queue", { signal, cache: "no-store" }),
    fetchJiraSprintStats(signal)
  ]);

  const next: DashboardHubStats = { ...emptyDashboardHubStats, ...jiraStats };

  if (prsRes.ok) {
    const prsBody = (await prsRes.json()) as { status: string; data?: unknown[] };
    next.openPrs =
      prsBody.status === "ok" && Array.isArray(prsBody.data) ? prsBody.data.length : 0;
  }

  if (tasksRes.ok) {
    const tasksBody = (await tasksRes.json()) as TaskListResponse;
    next.openTasks = tasksBody.open.length;
    next.overdueTasks = tasksBody.open.filter((task) => task.isOverdue).length;
  }

  if (reviewerQueueRes.ok) {
    const queueBody = (await reviewerQueueRes.json()) as ReviewerQueueApiResponse;
    if (queueBody.status === "ok") {
      next.pendingReviews = queueBody.data.filter((pr) => pr.myReviewStatus === "pending").length;
    }
  }

  return next;
}
