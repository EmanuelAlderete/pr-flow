import { NextResponse } from "next/server";
import { ptBR } from "@/modules/messages";
import { startLocalPrReview } from "@/modules/prs/lib/local-review/local-review-service";
import { localReviewTriggerSchema } from "@/modules/prs/lib/local-review/local-review-trigger-validation";

export async function POST(request: Request) {
  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ status: "error", message: "Corpo da requisição inválido." }, { status: 400 });
  }

  const parsed = localReviewTriggerSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ status: "error", message: ptBR.localReview.triggerFailed }, { status: 400 });
  }

  const result = await startLocalPrReview(parsed.data);
  const status = result.status === "error" ? 500 : 200;
  return NextResponse.json(result, { status });
}
