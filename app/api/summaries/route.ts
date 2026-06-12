import { NextResponse } from "next/server";
import { ptBR } from "@/modules/messages";
import type { SummaryType } from "@/modules/summaries/lib/schema";
import { listSummaries } from "@/modules/summaries/lib/summary-repository";

function parseSummaryType(value: string | null): SummaryType | undefined {
  if (value === "daily" || value === "weekly") {
    return value;
  }
  return undefined;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const type = parseSummaryType(searchParams.get("type"));
  const limitParam = searchParams.get("limit");
  const limit = limitParam ? Math.min(Math.max(Number(limitParam), 1), 100) : 50;

  if (searchParams.get("type") && !type) {
    return NextResponse.json({ message: "type deve ser daily ou weekly." }, { status: 400 });
  }

  try {
    const summaries = await listSummaries({ type, limit });
    return NextResponse.json({ summaries });
  } catch (error) {
    const message = error instanceof Error ? error.message : ptBR.summary.listFailed;
    return NextResponse.json({ message }, { status: 500 });
  }
}
