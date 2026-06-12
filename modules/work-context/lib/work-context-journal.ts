import { listActiveNotesMentioningIssueKey } from "@/modules/journal/lib/note-repository";
import { normalizeJiraIssueKey } from "@/modules/jira-issue-key";
import type { WorkContextJournalMention } from "@/modules/work-context/lib/domain";
import { extractJournalMentionsForIssueKey } from "@/modules/work-context/lib/journal-mentions";

export async function loadWorkContextJournalMentions(
  issueKeyInput: string
): Promise<WorkContextJournalMention[]> {
  const issueKey = normalizeJiraIssueKey(issueKeyInput);
  const notes = await listActiveNotesMentioningIssueKey(issueKey);
  return extractJournalMentionsForIssueKey(
    notes.map((note) => ({ notebookDay: note.notebookDay, body: note.body })),
    issueKey
  );
}
