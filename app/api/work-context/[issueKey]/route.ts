import { NextResponse } from "next/server";
import { buildWorkContext } from "@/modules/work-context/lib/build-work-context";
import { normalizeJiraIssueKey } from "@/modules/jira-issue-key";

const ISSUE_KEY_PATTERN = /^[A-Z][A-Z0-9]+-\d+$/;

type RouteContext = {
  params: Promise<{ issueKey: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const { issueKey } = await context.params;
  const normalizedKey = normalizeJiraIssueKey(issueKey);

  if (!ISSUE_KEY_PATTERN.test(normalizedKey)) {
    return NextResponse.json({ error: "Chave de ticket inválida." }, { status: 400 });
  }

  const payload = await buildWorkContext(normalizedKey);
  return NextResponse.json(payload);
}
