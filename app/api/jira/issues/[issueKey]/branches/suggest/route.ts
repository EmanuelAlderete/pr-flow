import { NextResponse } from "next/server";
import { suggestJiraBranchSlug } from "@/modules/jira-branch/lib/jira-branch-service";

const ISSUE_KEY_PATTERN = /^[A-Z][A-Z0-9]+-\d+$/;

type RouteContext = {
  params: Promise<{ issueKey: string }>;
};

export async function POST(_request: Request, context: RouteContext) {
  const { issueKey } = await context.params;
  const normalizedKey = issueKey.trim().toUpperCase();

  if (!ISSUE_KEY_PATTERN.test(normalizedKey)) {
    return NextResponse.json({ error: "Chave de ticket inválida." }, { status: 400 });
  }

  const result = await suggestJiraBranchSlug(normalizedKey);

  if (result.status === "not_found") {
    return NextResponse.json({ error: result.message }, { status: 404 });
  }

  if (result.status === "rate_limited") {
    return NextResponse.json({ error: result.message }, { status: 429 });
  }

  if (result.status === "error") {
    return NextResponse.json({ error: result.message }, { status: 500 });
  }

  return NextResponse.json({
    prefix: result.prefix,
    slug: result.slug,
    branchName: result.branchName,
    aiAvailable: result.aiAvailable
  });
}
