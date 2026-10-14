import type { NoteDto } from "@/modules/journal/lib/domain";
import { appendQuickNoteToToday } from "@/modules/journal/lib/note-service";
import { validateQuickNoteInput, type QuickNoteInput } from "@/modules/journal/lib/note-validation";
import { classifyQuickNoteWithAi } from "@/modules/journal/lib/quick-note-classifier";
import { createTaskFromInput } from "@/modules/tasks/lib/task-service";
import type { TaskDto } from "@/modules/tasks/lib/domain";

export type QuickNoteRoutedBy = "ai" | "fallback";

export type SubmitQuickNoteResult =
  | {
      ok: true;
      routedBy: QuickNoteRoutedBy;
      note: NoteDto;
      tasks: TaskDto[];
    }
  | { ok: false; status: 400; errors: Record<string, string> }
  | { ok: false; status: 404 }
  | { ok: false; status: 409 };

export async function submitQuickNote(
  input: QuickNoteInput,
  now: Date = new Date()
): Promise<SubmitQuickNoteResult> {
  const validation = validateQuickNoteInput(input);
  if (!validation.ok) {
    return { ok: false, status: 400, errors: validation.errors };
  }

  const { text } = validation.value;
  const classification = await classifyQuickNoteWithAi(text, now);

  const journalResult = await appendQuickNoteToToday({ text }, now);
  if (!journalResult.ok) {
    return journalResult;
  }

  if (!classification.ok) {
    return {
      ok: true,
      routedBy: "fallback",
      note: journalResult.note,
      tasks: []
    };
  }

  const tasks: TaskDto[] = [];
  for (const draft of classification.classification.tasks) {
    const taskResult = await createTaskFromInput({
      title: draft.title,
      description: draft.description,
      dueDate: draft.dueDate
    });
    if (taskResult.ok) {
      tasks.push(taskResult.task);
    }
  }

  return {
    ok: true,
    routedBy: "ai",
    note: journalResult.note,
    tasks
  };
}
