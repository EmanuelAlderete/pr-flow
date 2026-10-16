export type JournalDayDraftSuccess = {
  status: "ok";
  day: string;
  draft: string;
};

export type JournalDayDraftMissingApiKey = {
  status: "missing_api_key";
  message: string;
};

export type JournalDayDraftRateLimited = {
  status: "rate_limited";
  message: string;
};

export type JournalDayDraftNoInput = {
  status: "no_input";
  day: string;
  message: string;
};

export type JournalDayDraftError = {
  status: "error";
  message: string;
};

export type JournalDayDraftResponse =
  | JournalDayDraftSuccess
  | JournalDayDraftMissingApiKey
  | JournalDayDraftRateLimited
  | JournalDayDraftNoInput
  | JournalDayDraftError;

export function normalizeJournalDayDraft(raw: string): string {
  const trimmed = raw.trim();
  const fenced = trimmed.match(/^```(?:markdown|md)?\s*([\s\S]*?)\s*```$/i);
  return (fenced?.[1] ?? trimmed).trim();
}

export function mergeJournalDayDraft(currentBody: string, draft: string): string {
  const existing = currentBody.trim();
  const generated = draft.trim();
  if (!generated) {
    return currentBody;
  }
  if (!existing) {
    return generated;
  }
  if (existing.includes(generated)) {
    return currentBody;
  }
  return `${existing}\n\n${generated}`;
}
