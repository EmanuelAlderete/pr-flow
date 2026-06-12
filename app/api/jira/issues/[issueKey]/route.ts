import { NextResponse } from "next/server";
import { JiraApiError } from "@/modules/jira/lib/jira-errors";
import { jiraErrorResponse } from "@/modules/jira/lib/jira-route-errors";
import { getJiraIssueDetailFromCache } from "@/modules/jira/lib/jira-read-service";

const ISSUE_KEY_PATTERN = /^[A-Z][A-Z0-9]+-\d+$/;

type RouteContext = {
  params: Promise<{ issueKey: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { issueKey } = await context.params;
    const normalizedKey = issueKey.trim().toUpperCase();

    if (!ISSUE_KEY_PATTERN.test(normalizedKey)) {
      return NextResponse.json({ error: "Chave de ticket inválida." }, { status: 400 });
    }

    const payload = await getJiraIssueDetailFromCache(normalizedKey);

    if (!payload) {
      return NextResponse.json(
        { error: "Detalhes do ticket ainda não estão no cache. Aguarde a próxima sincronização." },
        { status: 404 }
      );
    }

    return NextResponse.json(payload);
  } catch (error) {
    if (error instanceof JiraApiError && error.status === 404) {
      return NextResponse.json({ error: "Ticket não encontrado no Jira." }, { status: 404 });
    }

    return jiraErrorResponse(error, "Não foi possível carregar os detalhes do ticket no Jira.");
  }
}
