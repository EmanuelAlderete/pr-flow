import { NextResponse } from "next/server";
import { writeSystemLogFireAndForget } from "@/modules/observability/lib/system-logger";
import { createJiraBranches } from "@/modules/jira-branch/lib/jira-branch-service";
import {
  formatZodError,
  jiraBranchCreateSchema
} from "@/modules/jira-branch/lib/jira-branch-validation";

const ISSUE_KEY_PATTERN = /^[A-Z][A-Z0-9]+-\d+$/;
const API_JIRA_BRANCH_CREATE_LOG_SOURCE = "api:jira-branch-create";

type RouteContext = {
  params: Promise<{ issueKey: string }>;
};

export async function POST(request: Request, context: RouteContext) {
  const { issueKey } = await context.params;
  const normalizedKey = issueKey.trim().toUpperCase();

  if (!ISSUE_KEY_PATTERN.test(normalizedKey)) {
    return NextResponse.json({ error: "Chave de ticket inválida." }, { status: 400 });
  }

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido." }, { status: 400 });
  }

  const parsed = jiraBranchCreateSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ errors: formatZodError(parsed.error) }, { status: 400 });
  }

  writeSystemLogFireAndForget({
    level: "info",
    source: API_JIRA_BRANCH_CREATE_LOG_SOURCE,
    message: "Criação de branch solicitada via API.",
    details: {
      issueKey: normalizedKey,
      slug: parsed.data.slug,
      repositories: parsed.data.targets.map((target) => target.repository)
    }
  });

  const result = await createJiraBranches(normalizedKey, parsed.data);

  if (result.status === "not_found") {
    return NextResponse.json({ error: result.message }, { status: 404 });
  }

  if (result.status === "unauthenticated") {
    return NextResponse.json({ error: result.message }, { status: 401 });
  }

  if (result.status === "error") {
    return NextResponse.json({ error: result.message }, { status: 500 });
  }

  const createdCount = result.results.filter((item) => item.status === "created").length;

  return NextResponse.json(
    {
      prefix: result.prefix,
      branchName: result.branchName,
      results: result.results,
      createdCount
    },
    { status: createdCount > 0 ? 201 : 200 }
  );
}
