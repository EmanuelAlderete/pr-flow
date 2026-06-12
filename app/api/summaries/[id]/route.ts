import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { summaries } from "@/modules/summaries/lib/schema";
import type { SummaryDto } from "@/modules/summaries/lib/domain";
import { getDb } from "@/modules/db/lib/db";

function toDto(row: typeof summaries.$inferSelect): SummaryDto {
  return {
    id: row.id,
    type: row.type,
    periodKey: row.periodKey,
    content: row.content,
    generatedAt: row.generatedAt.toISOString()
  };
}

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;

  try {
    const db = getDb();
    const [row] = await db.select().from(summaries).where(eq(summaries.id, id));

    if (!row) {
      return NextResponse.json({ message: "Resumo não encontrado." }, { status: 404 });
    }

    return NextResponse.json({ summary: toDto(row) });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Falha ao carregar resumo.";
    return NextResponse.json({ message }, { status: 500 });
  }
}
