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
      destination: "journal";
      routedBy: QuickNoteRoutedBy;
      note: NoteDto;
    }
  | {
      ok: true;
      destination: "task";
      routedBy: "ai";
      task: TaskDto;
    }
  | { ok: false; status: 400; errors: Record<string, string> }
  | { ok: false; status: 404 }
  | { ok: false; status: 409 };

async function saveAsJournalQuickNote(
  input: QuickNoteInput,
  now: Date
): Promise<SubmitQuickNoteResult> {
  const result = await appendQuickNoteToToday(input, now);
  if (!result.ok) {
    return result;
  }
  return { ok: true, destination: "journal", routedBy: "fallback", note: result.note };
}

export async function submitQuickNote(
  input: QuickNoteInput,
  now: Date = new Date()
): Promise<SubmitQuickNoteResult> {
  const validation = validateQuickNoteInput(input);
  if (!validation.ok) {
    return { ok: false, status: 400, errors: validation.errors };
  }

  const { text } = validation.value;
  const classification = await classifyQuickNoteWithAi(text);

  if (!classification.ok || classification.classification.destination === "journal") {
    const routedBy: QuickNoteRoutedBy = classification.ok ? "ai" : "fallback";
    const journalResult = await appendQuickNoteToToday({ text }, now);
    if (!journalResult.ok) {
      return journalResult;
    }
    return { ok: true, destination: "journal", routedBy, note: journalResult.note };
  }

  const taskInput = {
    title: classification.classification.title,
    description: classification.classification.description,
    dueDate: classification.classification.dueDate
  };
  const taskResult = await createTaskFromInput(taskInput);
  if (!taskResult.ok) {
    const fallback = await saveAsJournalQuickNote({ text }, now);
    if (fallback.ok && fallback.destination === "journal") {
      return { ...fallback, routedBy: "fallback" };
    }
    return fallback;
  }

  return {
    ok: true,
    destination: "task",
    routedBy: "ai",
    task: taskResult.task
  };
}
