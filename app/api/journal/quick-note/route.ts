import { NextResponse } from "next/server";
import { submitQuickNote } from "@/modules/journal/lib/quick-note-submit-service";
import type { QuickNoteInput } from "@/modules/journal/lib/note-validation";

export async function POST(request: Request) {
  const body = (await request.json()) as QuickNoteInput;
  const result = await submitQuickNote(body);

  if (!result.ok) {
    if (result.status === 400) {
      return NextResponse.json({ errors: result.errors }, { status: 400 });
    }
    if (result.status === 404) {
      return NextResponse.json({ message: "Note not found." }, { status: 404 });
    }
    return NextResponse.json(
      { error: "Já existe uma Note ativa para este Notebook day." },
      { status: 409 }
    );
  }

  const status = result.tasks.length > 0 ? 201 : 200;
  return NextResponse.json(
    {
      routedBy: result.routedBy,
      note: result.note,
      tasks: result.tasks
    },
    { status }
  );
}
