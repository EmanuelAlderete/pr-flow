import { NextResponse } from "next/server";
import { checkJiraBranches } from "@/modules/jira-branch/lib/jira-branch-service";
import {
  formatZodError,
  jiraBranchCheckSchema
} from "@/modules/jira-branch/lib/jira-branch-validation";

const ISSUE_KEY_PATTERN = /^[A-Z][A-Z0-9]+-\d+$/;

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

  const parsed = jiraBranchCheckSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ errors: formatZodError(parsed.error) }, { status: 400 });
  }

  const result = await checkJiraBranches(normalizedKey, parsed.data);

  if (result.status === "not_found") {
    return NextResponse.json({ error: result.message }, { status: 404 });
  }

  if (result.status === "unauthenticated") {
    return NextResponse.json({ error: result.message }, { status: 401 });
  }

  if (result.status === "error") {
    return NextResponse.json({ error: result.message }, { status: 500 });
  }

  return NextResponse.json({
    prefix: result.prefix,
    branchName: result.branchName,
    checks: result.checks
  });
}
