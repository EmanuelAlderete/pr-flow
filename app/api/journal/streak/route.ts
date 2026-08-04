import { NextResponse } from "next/server";
import { getJournalStreakSnapshot } from "@/modules/journal/lib/journal-streak-service";

export async function GET() {
  const snapshot = await getJournalStreakSnapshot();
  return NextResponse.json(snapshot);
}
