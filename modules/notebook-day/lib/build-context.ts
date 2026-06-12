import { buildDailySummaryJiraContext } from "@/modules/notebook-day/lib/jira-context";
import { buildDailySummaryPrContext } from "@/modules/notebook-day/lib/pr-context";
import type { DailySummaryContext, DailySummaryTaskItem } from "@/modules/notebook-day/lib/types";
import { getActiveNoteByNotebookDay } from "@/modules/journal/lib/note-repository";
import { listTaskLists } from "@/modules/tasks/lib/task-repository";

function toPendingItem(
  task: Awaited<ReturnType<typeof listTaskLists>>["open"][number]
): DailySummaryTaskItem {
  return {
    title: task.title,
    description: task.description,
    dueDate: task.dueDate,
    isOverdue: task.isOverdue
  };
}

function toCompletedItem(
  task: Awaited<ReturnType<typeof listTaskLists>>["completed"][number]
): DailySummaryTaskItem {
  return {
    title: task.title,
    description: task.description,
    dueDate: task.dueDate
  };
}

export async function buildNotebookDayContext(day: string): Promise<DailySummaryContext> {
  const [note, lists, jira, prs] = await Promise.all([
    getActiveNoteByNotebookDay(day),
    listTaskLists(day),
    buildDailySummaryJiraContext(day),
    buildDailySummaryPrContext(day)
  ]);

  return {
    day,
    noteBody: note?.body ?? null,
    pendingTasks: lists.open.map(toPendingItem),
    completedTodayTasks: lists.completed.map(toCompletedItem),
    jira,
    prs
  };
}

/** @deprecated Use `buildNotebookDayContext` — alias para compatibilidade. */
export const buildDailySummaryContext = buildNotebookDayContext;
