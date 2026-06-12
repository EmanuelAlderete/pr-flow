import type { NoteDto } from "@/modules/journal/lib/domain";
import {
  createNote,
  getActiveNoteByNotebookDay,
  removeNote,
  updateNote
} from "@/modules/journal/lib/note-repository";
import { todayLocalDateString } from "@/modules/journal/lib/notebook-day";
import { appendQuickNoteToBody } from "@/modules/journal/lib/quick-note";
import {
  validateAppendedNoteBody,
  validateCreateNoteInput,
  validateNotebookDayQuery,
  validateQuickNoteInput,
  validateUpdateNoteInput,
  type CreateNoteInput,
  type QuickNoteInput,
  type UpdateNoteInput
} from "@/modules/journal/lib/note-validation";

export type GetNoteForDayResult =
  | { ok: true; note: NoteDto | null }
  | { ok: false; errors: Record<string, string> };

export async function getNoteForDay(notebookDay: string | null): Promise<GetNoteForDayResult> {
  const validation = validateNotebookDayQuery(notebookDay);
  if (!validation.ok) {
    return validation;
  }

  const note = await getActiveNoteByNotebookDay(validation.value);
  return { ok: true, note };
}

export type CreateNoteResult =
  | { ok: true; note: NoteDto }
  | { ok: false; status: 400; errors: Record<string, string> }
  | { ok: false; status: 409 };

export async function createNoteFromInput(input: CreateNoteInput): Promise<CreateNoteResult> {
  const validation = validateCreateNoteInput(input);
  if (!validation.ok) {
    return { ok: false, status: 400, errors: validation.errors };
  }

  const note = await createNote(validation.value);
  if (!note) {
    return { ok: false, status: 409 };
  }

  return { ok: true, note };
}

export type UpdateNoteResult =
  | { ok: true; note: NoteDto }
  | { ok: false; status: 400; errors: Record<string, string> }
  | { ok: false; status: 404 };

export async function updateNoteFromInput(id: string, input: UpdateNoteInput): Promise<UpdateNoteResult> {
  const validation = validateUpdateNoteInput(input);
  if (!validation.ok) {
    return { ok: false, status: 400, errors: validation.errors };
  }

  const note = await updateNote(id, validation.value);
  return note ? { ok: true, note } : { ok: false, status: 404 };
}

export async function removeNoteById(id: string): Promise<{ ok: true } | { ok: false; status: 404 }> {
  const removed = await removeNote(id);
  return removed ? { ok: true } : { ok: false, status: 404 };
}

export type AppendQuickNoteResult =
  | { ok: true; note: NoteDto }
  | { ok: false; status: 400; errors: Record<string, string> }
  | { ok: false; status: 404 }
  | { ok: false; status: 409 };

export async function appendQuickNoteToToday(
  input: QuickNoteInput,
  now: Date = new Date()
): Promise<AppendQuickNoteResult> {
  const validation = validateQuickNoteInput(input);
  if (!validation.ok) {
    return { ok: false, status: 400, errors: validation.errors };
  }

  const notebookDay = todayLocalDateString(now);
  const existing = await getActiveNoteByNotebookDay(notebookDay);
  const newBody = appendQuickNoteToBody(existing?.body ?? "", validation.value.text, now);
  const bodyValidation = validateAppendedNoteBody(newBody);

  if (!bodyValidation.ok) {
    return { ok: false, status: 400, errors: bodyValidation.errors };
  }

  if (existing) {
    const note = await updateNote(existing.id, bodyValidation.value);
    return note ? { ok: true, note } : { ok: false, status: 404 };
  }

  const note = await createNote({ notebookDay, body: bodyValidation.value.body });
  if (!note) {
    return { ok: false, status: 409 };
  }

  return { ok: true, note };
}
