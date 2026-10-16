import { NextResponse } from "next/server";
import { markStandupScriptUsed } from "@/modules/day-follow-up/lib/follow-up-service";
import { followUpDaySchema } from "@/modules/day-follow-up/lib/validation";

export async function POST(request: Request) {
  const body: unknown = await request.json();
  const parsed = followUpDaySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Notebook day inválido." }, { status: 400 });
  }

  const script = await markStandupScriptUsed(parsed.data.notebookDay);
  return NextResponse.json({ script, windowOpen: false });
}
