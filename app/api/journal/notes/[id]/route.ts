import { NextResponse } from "next/server";
import { removeNoteById, updateNoteFromInput } from "@/modules/journal/lib/note-service";
import type { UpdateNoteInput } from "@/modules/journal/lib/note-validation";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  const { id } = await context.params;
  const body = (await request.json()) as UpdateNoteInput;
  const result = await updateNoteFromInput(id, body);

  if (!result.ok) {
    if (result.status === 400) {
      return NextResponse.json({ errors: result.errors }, { status: 400 });
    }
    return NextResponse.json({ message: "Note not found." }, { status: 404 });
  }

  return NextResponse.json(result.note);
}

export async function DELETE(_request: Request, context: RouteContext) {
  const { id } = await context.params;
  const result = await removeNoteById(id);

  if (!result.ok) {
    return NextResponse.json({ message: "Note not found." }, { status: 404 });
  }

  return new NextResponse(null, { status: 204 });
}
