import { NextResponse } from "next/server";
import { parseJiraSprintFilter } from "@/modules/jira/lib/jira-jql";
import { jiraErrorResponse } from "@/modules/jira/lib/jira-route-errors";
import { getJiraIssuesFromCache } from "@/modules/jira/lib/jira-read-service";

export async function GET(request: Request) {
  try {
    const sprintParam = new URL(request.url).searchParams.get("sprint");
    const sprintFilter = parseJiraSprintFilter(sprintParam);
    const payload = await getJiraIssuesFromCache(sprintFilter);
    return NextResponse.json(payload);
  } catch (error) {
    return jiraErrorResponse(error, "Não foi possível carregar os tickets do Jira.");
  }
}
