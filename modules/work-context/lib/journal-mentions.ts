import type { WorkContextJournalMention } from "@/modules/work-context/lib/domain";

const JIRA_KEY_IN_TEXT = /\bJOR-\d+\b/gi;
const CODE_FENCE = /```[\s\S]*?```/g;

type NoteBody = {
  notebookDay: string;
  body: string;
};

function stripCodeFences(markdown: string): string {
  return markdown.replace(CODE_FENCE, "");
}

function excerptAroundKey(body: string, issueKey: string): string | null {
  const pattern = new RegExp(`\\b${issueKey.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i");
  const match = body.match(pattern);
  if (!match || match.index === undefined) {
    return null;
  }

  const start = Math.max(0, match.index - 40);
  const end = Math.min(body.length, match.index + issueKey.length + 60);
  const slice = body.slice(start, end).replace(/\s+/g, " ").trim();
  const prefix = start > 0 ? "…" : "";
  const suffix = end < body.length ? "…" : "";
  return `${prefix}${slice}${suffix}`;
}

export function extractJournalMentionsForIssueKey(
  notes: NoteBody[],
  issueKey: string
): WorkContextJournalMention[] {
  const normalizedKey = issueKey.trim().toUpperCase();
  const mentions: WorkContextJournalMention[] = [];

  for (const note of notes) {
    const searchable = stripCodeFences(note.body);
    if (!JIRA_KEY_IN_TEXT.test(searchable)) {
      JIRA_KEY_IN_TEXT.lastIndex = 0;
      continue;
    }
    JIRA_KEY_IN_TEXT.lastIndex = 0;

    if (!new RegExp(`\\b${normalizedKey}\\b`, "i").test(searchable)) {
      continue;
    }

    const excerpt = excerptAroundKey(note.body, normalizedKey);
    if (!excerpt) {
      continue;
    }

    mentions.push({
      notebookDay: note.notebookDay,
      excerpt
    });
  }

  return mentions.sort((a, b) => b.notebookDay.localeCompare(a.notebookDay));
}
