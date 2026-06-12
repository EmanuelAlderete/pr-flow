import { isCompletedOnNotebookDay, localCalendarDateOnly } from "@/modules/journal/lib/notebook-day";
import type { OpenTaskDto, TaskDto, TaskListResponse, TaskRecord } from "@/modules/tasks/lib/domain";
import { sortCompletedTasks, sortOpenTasks } from "@/modules/tasks/lib/task-ordering";
import { isTaskOverdue } from "@/modules/tasks/lib/task-overdue";

export function taskRecordToDto(record: TaskRecord): TaskDto {
  return {
    id: record.id,
    title: record.title,
    description: record.description,
    dueDate: record.dueDate ? formatDateOnly(record.dueDate) : null,
    completedAt: record.completedAt ? record.completedAt.toISOString() : null,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString()
  };
}

function formatDateOnly(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function groupTasksByList(
  records: TaskRecord[],
  today = new Date(),
  completedOnDay: string = localCalendarDateOnly(today)
): TaskListResponse {
  const open: OpenTaskDto[] = [];
  const completed: TaskDto[] = [];
  for (const record of records) {
    const dto = taskRecordToDto(record);
    if (record.completedAt === null) {
      open.push({
        ...dto,
        isOverdue: isTaskOverdue(dto.dueDate, today)
      });
    } else if (isCompletedOnNotebookDay(record.completedAt, completedOnDay)) {
      completed.push(dto);
    }
  }

  return {
    open: sortOpenTasks(open),
    completed: sortCompletedTasks(completed)
  };
}
