import { NextResponse } from "next/server";
import { z } from "zod";
import { redactDiffLikeMessage } from "@/modules/observability/lib/log-sanitize";
import { writeSystemLogFireAndForget } from "@/modules/observability/lib/system-logger";
import {
  formatZodError,
  openPrGenerateBodySchema
} from "@/modules/prs/lib/open-pr/open-pr-validation";
import { generateOpenPrBodyForBranch } from "@/modules/prs/lib/open-pr/open-pr-service";

const OPEN_PR_GENERATE_BODY_API_LOG_SOURCE = "open-pr:generate-body-api";

const generateBodyRequestSchema = openPrGenerateBodySchema.extend({
  title: z.string().trim().min(1, "Título é obrigatório.")
});

export async function POST(request: Request) {
  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido." }, { status: 400 });
  }

  const parsed = generateBodyRequestSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ errors: formatZodError(parsed.error) }, { status: 400 });
  }

  writeSystemLogFireAndForget({
    level: "info",
    source: OPEN_PR_GENERATE_BODY_API_LOG_SOURCE,
    message: "Requisição de geração do corpo da PR",
    details: {
      repository: parsed.data.repository,
      branch: parsed.data.branch,
      baseBranch: parsed.data.baseBranch,
      title: parsed.data.title
    }
  });

  const result = await generateOpenPrBodyForBranch(parsed.data);

  if (result.status === "missing_api_key") {
    writeSystemLogFireAndForget({
      level: "warn",
      source: OPEN_PR_GENERATE_BODY_API_LOG_SOURCE,
      message: redactDiffLikeMessage(result.message),
      details: { repository: parsed.data.repository, branch: parsed.data.branch, code: "missing_api_key" }
    });
    return NextResponse.json({ error: result.message, code: "missing_api_key" }, { status: 503 });
  }

  if (result.status === "rate_limited") {
    writeSystemLogFireAndForget({
      level: "warn",
      source: OPEN_PR_GENERATE_BODY_API_LOG_SOURCE,
      message: redactDiffLikeMessage(result.message),
      details: { repository: parsed.data.repository, branch: parsed.data.branch, code: "rate_limited" }
    });
    return NextResponse.json({ error: result.message, code: "rate_limited" }, { status: 429 });
  }

  if (result.status === "error") {
    writeSystemLogFireAndForget({
      level: "error",
      source: OPEN_PR_GENERATE_BODY_API_LOG_SOURCE,
      message: redactDiffLikeMessage(result.message),
      details: { repository: parsed.data.repository, branch: parsed.data.branch, code: "error" }
    });
    return NextResponse.json({ error: result.message }, { status: 500 });
  }

  writeSystemLogFireAndForget({
    level: "info",
    source: OPEN_PR_GENERATE_BODY_API_LOG_SOURCE,
    message: "Corpo da PR gerado",
    details: {
      repository: parsed.data.repository,
      branch: parsed.data.branch,
      bodyChars: result.body.length
    }
  });

  return NextResponse.json({ body: result.body });
}
