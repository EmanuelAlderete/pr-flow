import { NextResponse } from "next/server";
import { JiraConfigError } from "@/modules/jira/lib/jira-config";
import { JiraCacheNotReadyError } from "@/modules/jira/lib/jira-cache-errors";
import { JiraApiError } from "@/modules/jira/lib/jira-errors";

export function jiraErrorResponse(error: unknown, fallbackMessage: string): NextResponse {
  if (error instanceof JiraConfigError) {
    return NextResponse.json({ error: error.message }, { status: 503 });
  }
  if (error instanceof JiraCacheNotReadyError) {
    return NextResponse.json({ error: error.message }, { status: 503 });
  }
  if (error instanceof JiraApiError) {
    return NextResponse.json(
      { error: error.message },
      { status: error.status >= 500 ? 502 : error.status }
    );
  }
  if (error instanceof Error && error.message.includes("sprint inválido")) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
  return NextResponse.json({ error: fallbackMessage }, { status: 500 });
}
