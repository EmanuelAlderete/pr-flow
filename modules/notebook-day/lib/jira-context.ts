import type { DailySummaryJiraContext, DailySummaryJiraItem } from "@/modules/notebook-day/lib/types";
import { localCalendarDateOnly } from "@/modules/journal/lib/notebook-day";
import type { JiraIssueDto } from "@/modules/jira/lib/domain";
import {
  hasJiraCache,
  loadJiraIssueDetail,
  loadJiraIssuesCache,
  loadJiraSprintsCache
} from "@/modules/jira/lib/jira-cache-repository";
import { resolveDefaultSprintFilter } from "@/modules/jira/lib/jira-sprint-filter";

function sprintLabelForFilter(
  sprintFilter: string,
  sprints: Awaited<ReturnType<typeof loadJiraSprintsCache>>
): string | null {
  if (!sprints) {
    return null;
  }
  if (sprintFilter === "all") {
    return "Todos os tickets";
  }
  if (sprintFilter === "open") {
    return "Tickets abertos";
  }
  const sprint = sprints.sprints.find((item) => String(item.id) === sprintFilter);
  return sprint?.name ?? null;
}

function isUpdatedOnNotebookDay(updated: string, day: string): boolean {
  const parsed = new Date(updated);
  if (Number.isNaN(parsed.getTime())) {
    return false;
  }
  return localCalendarDateOnly(parsed) === day;
}

async function mapIssueToSummaryItem(issue: JiraIssueDto, day: string): Promise<DailySummaryJiraItem> {
  const detail = await loadJiraIssueDetail(issue.key);
  const updatedOnDay = isUpdatedOnNotebookDay(issue.updated, day);

  return {
    key: issue.key,
    summary: issue.summary,
    statusName: issue.statusName,
    statusCategoryKey: issue.statusCategoryKey,
    issueTypeName: issue.issueTypeName,
    priorityName: issue.priorityName,
    updated: issue.updated,
    updatedOnDay,
    hours: detail?.hours ?? null,
    timeSpentLabel: detail?.timeProgress?.spentLabel ?? null,
    estimateLabel: detail?.timeProgress?.estimateLabel ?? null,
    percentSpent: detail?.timeProgress?.percent ?? null
  };
}

export async function buildDailySummaryJiraContext(day: string): Promise<DailySummaryJiraContext | null> {
  if (!(await hasJiraCache())) {
    return null;
  }

  const sprints = await loadJiraSprintsCache();
  if (!sprints) {
    return null;
  }

  const sprintFilter = resolveDefaultSprintFilter(sprints.sprints);
  const cached = await loadJiraIssuesCache(sprintFilter);
  if (!cached || cached.issues.length === 0) {
    return {
      sprintLabel: sprintLabelForFilter(sprintFilter, sprints),
      issues: []
    };
  }

  const issues = await Promise.all(cached.issues.map((issue) => mapIssueToSummaryItem(issue, day)));

  issues.sort((a, b) => {
    if (a.updatedOnDay !== b.updatedOnDay) {
      return a.updatedOnDay ? -1 : 1;
    }
    return b.updated.localeCompare(a.updated);
  });

  return {
    sprintLabel: sprintLabelForFilter(sprintFilter, sprints),
    issues
  };
}

export function jiraContextHasActivityOnDay(jira: DailySummaryJiraContext | null | undefined): boolean {
  return Boolean(jira?.issues.some((issue) => issue.updatedOnDay));
}
