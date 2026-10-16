import { NextResponse } from "next/server";
import { loadDayFollowUp } from "@/modules/day-follow-up/lib/follow-up-service";
import { followUpDaySchema } from "@/modules/day-follow-up/lib/validation";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const parsed = followUpDaySchema.safeParse({ notebookDay: searchParams.get("notebookDay") });
  if (!parsed.success) {
    return NextResponse.json({ error: "Notebook day inválido." }, { status: 400 });
  }

  const view = await loadDayFollowUp(parsed.data.notebookDay);
  return NextResponse.json(view);
}
