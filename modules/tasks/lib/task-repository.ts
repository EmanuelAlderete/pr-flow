import { and, eq, gte, isNotNull, isNull, lt } from "drizzle-orm";
import { normalizeJiraIssueKey, textMentionsIssueKey } from "@/modules/jira-issue-key";
import { notebookDayToDate, todayLocalDateString } from "@/modules/journal/lib/notebook-day";
import type { OpenTaskDto, TaskDto, TaskListResponse, TaskRecord } from "@/modules/tasks/lib/domain";
import { getDb } from "@/modules/db/lib/db";
import { tasks } from "@/modules/tasks/lib/schema";
import { groupTasksByList, taskRecordToDto } from "@/modules/tasks/lib/task-list-grouping";
import { isTaskOverdue } from "@/modules/tasks/lib/task-overdue";
import type { ValidatedCreateTaskInput, ValidatedUpdateTaskInput } from "@/modules/tasks/lib/task-validation";

function toTaskRecord(row: typeof tasks.$inferSelect): TaskRecord {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    dueDate: row.dueDate ? new Date(`${row.dueDate}T00:00:00.000Z`) : null,
    completedAt: row.completedAt,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt
  };
}

export async function hasTasksCompletedOnNotebookDay(notebookDay: string): Promise<boolean> {
  const start = notebookDayToDate(notebookDay);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);

  const db = getDb();
  const [row] = await db
    .select({ id: tasks.id })
    .from(tasks)
    .where(
      and(
        isNull(tasks.deletedAt),
        isNotNull(tasks.completedAt),
        gte(tasks.completedAt, start),
        lt(tasks.completedAt, end)
      )
    )
    .limit(1);

  return Boolean(row);
}

export async function listAllActiveTasks(): Promise<TaskRecord[]> {
  const db = getDb();
  const rows = await db.select().from(tasks).where(isNull(tasks.deletedAt));
  return rows.map(toTaskRecord);
}

export async function listActiveTasksMentioningIssueKey(issueKey: string): Promise<TaskRecord[]> {
  const normalized = normalizeJiraIssueKey(issueKey);
  const active = await listAllActiveTasks();
  return active.filter((record) =>
    textMentionsIssueKey(`${record.title}\n${record.description ?? ""}`, normalized)
  );
}

export async function listTaskLists(completedOnDay?: string): Promise<TaskListResponse> {
  const db = getDb();
  const rows = await db.select().from(tasks).where(isNull(tasks.deletedAt));
  const day = completedOnDay ?? todayLocalDateString();
  return groupTasksByList(rows.map(toTaskRecord), new Date(), day);
}

async function findActiveRow(id: string) {
  const db = getDb();
  const [row] = await db
    .select()
    .from(tasks)
    .where(and(eq(tasks.id, id), isNull(tasks.deletedAt)));
  return row ?? null;
}

function toResponseDto(row: typeof tasks.$inferSelect): TaskDto | OpenTaskDto {
  const dto = taskRecordToDto(toTaskRecord(row));
  if (row.completedAt === null) {
    return { ...dto, isOverdue: isTaskOverdue(dto.dueDate, new Date()) };
  }
  return dto;
}

export async function completeTask(id: string): Promise<TaskDto | null> {
  const existing = await findActiveRow(id);
  if (!existing || existing.completedAt !== null) {
    return null;
  }

  const db = getDb();
  const now = new Date();
  const [row] = await db
    .update(tasks)
    .set({ completedAt: now, updatedAt: now })
    .where(eq(tasks.id, id))
    .returning();

  return taskRecordToDto(toTaskRecord(row));
}

export async function reopenTask(id: string): Promise<OpenTaskDto | null> {
  const existing = await findActiveRow(id);
  if (!existing || existing.completedAt === null) {
    return null;
  }

  const db = getDb();
  const now = new Date();
  const [row] = await db
    .update(tasks)
    .set({ completedAt: null, updatedAt: now })
    .where(eq(tasks.id, id))
    .returning();

  return toResponseDto(row) as OpenTaskDto;
}

export async function updateTask(id: string, input: ValidatedUpdateTaskInput): Promise<TaskDto | null> {
  const existing = await findActiveRow(id);
  if (!existing) {
    return null;
  }

  const db = getDb();
  const [row] = await db
    .update(tasks)
    .set({
      ...(input.title !== undefined ? { title: input.title } : {}),
      ...(input.description !== undefined ? { description: input.description } : {}),
      ...(input.dueDate !== undefined ? { dueDate: input.dueDate } : {}),
      updatedAt: new Date()
    })
    .where(eq(tasks.id, id))
    .returning();

  return toResponseDto(row);
}

export async function removeTask(id: string): Promise<boolean> {
  const existing = await findActiveRow(id);
  if (!existing) {
    return false;
  }

  const db = getDb();
  const now = new Date();
  await db.update(tasks).set({ deletedAt: now, updatedAt: now }).where(eq(tasks.id, id));
  return true;
}

export async function createTask(input: ValidatedCreateTaskInput): Promise<TaskDto> {
  const db = getDb();
  const [row] = await db
    .insert(tasks)
    .values({
      title: input.title,
      description: input.description,
      dueDate: input.dueDate
    })
    .returning();

  return taskRecordToDto(toTaskRecord(row));
}
