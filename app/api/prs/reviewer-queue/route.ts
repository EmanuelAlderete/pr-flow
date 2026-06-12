import { NextResponse } from "next/server";
import { getReviewerQueueFromCache } from "@/modules/prs/lib/pr-read-service";
import { prErrorResponse } from "@/modules/prs/lib/pr-route-errors";

export async function GET() {
  try {
    const result = await getReviewerQueueFromCache();
    return NextResponse.json(result);
  } catch (error) {
    return prErrorResponse(error, "Nao foi possivel carregar a fila de revisão.");
  }
}
