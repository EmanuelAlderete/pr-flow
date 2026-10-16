import { NextResponse } from "next/server";
import { submitQuizAnswer } from "@/modules/day-follow-up/lib/follow-up-service";
import { quizAnswerSchema } from "@/modules/day-follow-up/lib/validation";

export async function POST(request: Request) {
  const body: unknown = await request.json();
  const parsed = quizAnswerSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Resposta inválida." }, { status: 400 });
  }

  const result = await submitQuizAnswer(parsed.data);
  const status = result.status === "saved" ? 200 : 409;
  return NextResponse.json(result, { status });
}
