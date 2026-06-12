import { buildDailySummaryJiraContext, jiraContextHasActivityOnDay } from "@/modules/notebook-day/lib/jira-context";
import { buildDailySummaryPrContext, prContextHasSummaryInput } from "@/modules/notebook-day/lib/pr-context";
import type { DailySummaryContext } from "@/modules/notebook-day/lib/types";
import { getActiveNoteByNotebookDay } from "@/modules/journal/lib/note-repository";
import { DAILY_SUMMARY_NO_INPUT_MESSAGE } from "@/modules/messages";
import { hasTasksCompletedOnNotebookDay } from "@/modules/tasks/lib/task-repository";

export { DAILY_SUMMARY_NO_INPUT_MESSAGE };

/** Day input: journal note, task completed that civil day, Jira ticket updated, or PR review activity. Open tasks alone do not count. */
export function contextHasSummaryInput(context: DailySummaryContext): boolean {
  return (
    Boolean(context.noteBody?.trim()) ||
    context.completedTodayTasks.length > 0 ||
    jiraContextHasActivityOnDay(context.jira) ||
    prContextHasSummaryInput(context.prs)
  );
}

export async function hasNotebookContentOnDay(notebookDay: string): Promise<boolean> {
  const note = await getActiveNoteByNotebookDay(notebookDay);
  return Boolean(note?.body?.trim());
}

export async function dayHasJiraActivityOnDay(day: string): Promise<boolean> {
  const jira = await buildDailySummaryJiraContext(day);
  return jiraContextHasActivityOnDay(jira);
}

export async function dayHasPrActivityOnDay(day: string): Promise<boolean> {
  const prs = await buildDailySummaryPrContext(day);
  return prContextHasSummaryInput(prs);
}

export async function dayHasSummaryInput(day: string): Promise<boolean> {
  const [hasNote, hasCompleted, hasJira, hasPr] = await Promise.all([
    hasNotebookContentOnDay(day),
    hasTasksCompletedOnNotebookDay(day),
    dayHasJiraActivityOnDay(day),
    dayHasPrActivityOnDay(day)
  ]);
  return hasNote || hasCompleted || hasJira || hasPr;
}
