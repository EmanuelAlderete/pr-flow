import { NextResponse } from "next/server";
import { writeSystemLogFireAndForget } from "@/modules/observability/lib/system-logger";
import {
  formatZodError,
  openPrCreateSchema
} from "@/modules/prs/lib/open-pr/open-pr-validation";
import { createOpenPullRequest } from "@/modules/prs/lib/open-pr/open-pr-service";

const API_OPEN_PR_CREATE_LOG_SOURCE = "api:open-pr-create";

export async function POST(request: Request) {
  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido." }, { status: 400 });
  }

  const parsed = openPrCreateSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ errors: formatZodError(parsed.error) }, { status: 400 });
  }

  writeSystemLogFireAndForget({
    level: "info",
    source: API_OPEN_PR_CREATE_LOG_SOURCE,
    message: "Criação de PR solicitada via API.",
    details: {
      repository: parsed.data.repository,
      branch: parsed.data.branch,
      baseBranch: parsed.data.baseBranch,
      title: parsed.data.title
    }
  });

  const result = await createOpenPullRequest(parsed.data);

  if (result.status === "unauthenticated") {
    writeSystemLogFireAndForget({
      level: "warn",
      source: API_OPEN_PR_CREATE_LOG_SOURCE,
      message: result.message,
      details: { repository: parsed.data.repository, branch: parsed.data.branch, code: "unauthenticated" }
    });
    return NextResponse.json({ error: result.message }, { status: 401 });
  }

  if (result.status === "error") {
    writeSystemLogFireAndForget({
      level: "error",
      source: API_OPEN_PR_CREATE_LOG_SOURCE,
      message: result.message,
      details: { repository: parsed.data.repository, branch: parsed.data.branch, code: "error" }
    });
    return NextResponse.json({ error: result.message }, { status: 500 });
  }

  writeSystemLogFireAndForget({
    level: "info",
    source: API_OPEN_PR_CREATE_LOG_SOURCE,
    message: `PR criada (#${result.number}).`,
    details: {
      repository: parsed.data.repository,
      branch: parsed.data.branch,
      number: result.number,
      url: result.url
    }
  });

  return NextResponse.json({ url: result.url, number: result.number }, { status: 201 });
}
