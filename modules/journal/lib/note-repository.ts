import { and, asc, eq, gte, isNull, lte } from "drizzle-orm";
import { normalizeJiraIssueKey, textMentionsIssueKey } from "@/modules/jira-issue-key";
import type { NoteDto } from "@/modules/journal/lib/domain";
import { getDb } from "@/modules/db/lib/db";
import { notes } from "@/modules/journal/lib/schema";
import type {
  ValidatedCreateNoteInput,
  ValidatedUpdateNoteInput
} from "@/modules/journal/lib/note-validation";

function toNoteDto(row: typeof notes.$inferSelect): NoteDto {
  return {
    id: row.id,
    notebookDay: row.notebookDay,
    body: row.body,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString()
  };
}

export async function listActiveNotes(): Promise<NoteDto[]> {
  const db = getDb();
  const rows = await db.select().from(notes).where(isNull(notes.deletedAt));
  return rows.map(toNoteDto);
}

export async function listActiveNotesMentioningIssueKey(issueKey: string): Promise<NoteDto[]> {
  const normalized = normalizeJiraIssueKey(issueKey);
  const active = await listActiveNotes();
  return active.filter((note) => textMentionsIssueKey(note.body, normalized));
}

export async function getActiveNoteByNotebookDay(notebookDay: string): Promise<NoteDto | null> {
  const db = getDb();
  const [row] = await db
    .select()
    .from(notes)
    .where(and(eq(notes.notebookDay, notebookDay), isNull(notes.deletedAt)));

  return row ? toNoteDto(row) : null;
}

/** Active notebook days with a note in `[from, to]` (inclusive), ascending. */
export async function listActiveNotebookDaysBetween(
  from: string,
  to: string
): Promise<string[]> {
  const db = getDb();
  const rows = await db
    .select({ notebookDay: notes.notebookDay })
    .from(notes)
    .where(
      and(isNull(notes.deletedAt), gte(notes.notebookDay, from), lte(notes.notebookDay, to))
    )
    .orderBy(asc(notes.notebookDay));

  return rows.map((row) => row.notebookDay);
}

export async function createNote(input: ValidatedCreateNoteInput): Promise<NoteDto | null> {
  const existing = await getActiveNoteByNotebookDay(input.notebookDay);
  if (existing) {
    return null;
  }

  const db = getDb();
  const [row] = await db
    .insert(notes)
    .values({
      notebookDay: input.notebookDay,
      body: input.body
    })
    .returning();

  return toNoteDto(row);
}

async function findActiveRowById(id: string) {
  const db = getDb();
  const [row] = await db
    .select()
    .from(notes)
    .where(and(eq(notes.id, id), isNull(notes.deletedAt)));
  return row ?? null;
}

export async function updateNote(id: string, input: ValidatedUpdateNoteInput): Promise<NoteDto | null> {
  const existing = await findActiveRowById(id);
  if (!existing) {
    return null;
  }

  const db = getDb();
  const now = new Date();
  const [row] = await db
    .update(notes)
    .set({ body: input.body, updatedAt: now })
    .where(eq(notes.id, id))
    .returning();

  return toNoteDto(row);
}

export async function removeNote(id: string): Promise<boolean> {
  const existing = await findActiveRowById(id);
  if (!existing) {
    return false;
  }

  const db = getDb();
  const now = new Date();
  await db.update(notes).set({ deletedAt: now, updatedAt: now }).where(eq(notes.id, id));
  return true;
}
