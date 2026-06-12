import { NextResponse } from "next/server";
import { jiraErrorResponse } from "@/modules/jira/lib/jira-route-errors";
import { getJiraSprintsFromCache } from "@/modules/jira/lib/jira-read-service";

export async function GET() {
  try {
    const payload = await getJiraSprintsFromCache();
    return NextResponse.json(payload);
  } catch (error) {
    return jiraErrorResponse(error, "Não foi possível carregar as sprints do Jira.");
  }
}
