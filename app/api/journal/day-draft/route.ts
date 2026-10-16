import { NextResponse } from "next/server";
import { generateJournalDayDraft } from "@/modules/journal/lib/journal-day-draft-service";
import type { JournalDayDraftResponse } from "@/modules/journal/lib/journal-day-draft";
import {
  journalDayDraftFieldErrors,
  journalDayDraftRequestSchema
} from "@/modules/journal/lib/journal-day-draft-validation";
import { ptBR } from "@/modules/messages";

function jsonForResult(result: JournalDayDraftResponse) {
  if (result.status === "missing_api_key") {
    return NextResponse.json(result, { status: 503 });
  }
  if (result.status === "rate_limited") {
    return NextResponse.json(result, { status: 429 });
  }
  if (result.status === "no_input") {
    return NextResponse.json(result, { status: 422 });
  }
  if (result.status === "error") {
    return NextResponse.json(result, { status: 400 });
  }
  return NextResponse.json(result);
}

export async function POST(request: Request) {
  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ message: ptBR.journalDayDraft.invalidJson }, { status: 400 });
  }

  const parsed = journalDayDraftRequestSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ errors: journalDayDraftFieldErrors(parsed.error) }, { status: 400 });
  }

  const result = await generateJournalDayDraft(parsed.data.notebookDay);
  return jsonForResult(result);
}
