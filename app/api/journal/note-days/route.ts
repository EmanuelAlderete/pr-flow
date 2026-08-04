import { NextResponse } from "next/server";
import { getNotebookDaysWithNotes } from "@/modules/journal/lib/journal-streak-service";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const result = await getNotebookDaysWithNotes(
    searchParams.get("from"),
    searchParams.get("to")
  );

  if (!result.ok) {
    return NextResponse.json({ errors: result.errors }, { status: 400 });
  }

  return NextResponse.json({ notebookDays: result.notebookDays });
}
