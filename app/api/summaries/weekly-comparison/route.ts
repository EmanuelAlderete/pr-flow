import { NextResponse } from "next/server";
import { isValidNotebookDay } from "@/modules/journal/lib/notebook-day";
import { getWeeklyComparison } from "@/modules/summaries/lib/weekly-summary-comparison-service";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const weekMonday = searchParams.get("weekMonday");

  if (!weekMonday || !isValidNotebookDay(weekMonday)) {
    return NextResponse.json(
      { message: "weekMonday é obrigatório no formato YYYY-MM-DD (segunda-feira)." },
      { status: 400 }
    );
  }

  try {
    const comparison = await getWeeklyComparison(weekMonday);
    return NextResponse.json(comparison);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Falha ao comparar semanas.";
    return NextResponse.json({ message }, { status: 500 });
  }
}
