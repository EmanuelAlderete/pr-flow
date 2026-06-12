import { NextResponse } from "next/server";
import { createNoteFromInput, getNoteForDay } from "@/modules/journal/lib/note-service";
import type { CreateNoteInput } from "@/modules/journal/lib/note-validation";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const result = await getNoteForDay(searchParams.get("notebookDay"));

  if (!result.ok) {
    return NextResponse.json({ errors: result.errors }, { status: 400 });
  }

  return NextResponse.json({ note: result.note });
}

export async function POST(request: Request) {
  const body = (await request.json()) as CreateNoteInput;
  const result = await createNoteFromInput(body);

  if (!result.ok) {
    if (result.status === 409) {
      return NextResponse.json(
        { error: "Já existe uma Note ativa para este Notebook day." },
        { status: 409 }
      );
    }
    return NextResponse.json({ errors: result.errors }, { status: 400 });
  }

  return NextResponse.json(result.note, { status: 201 });
}
