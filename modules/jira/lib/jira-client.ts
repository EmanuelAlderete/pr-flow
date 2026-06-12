import { getJiraApiBaseUrl, getJiraCredentials } from "@/modules/jira/lib/jira-config";
import { JiraApiError, jiraApiErrorMessage } from "@/modules/jira/lib/jira-errors";

type JiraRequestInit = Omit<RequestInit, "headers"> & {
  headers?: Record<string, string>;
};

function buildAuthHeader(email: string, token: string): string {
  const credentials = Buffer.from(`${email}:${token}`, "utf8").toString("base64");
  return `Basic ${credentials}`;
}

export async function jiraFetch<T>(path: string, init: JiraRequestInit = {}): Promise<T> {
  const { email, token } = getJiraCredentials();
  const url = path.startsWith("http") ? path : `${getJiraApiBaseUrl()}${path}`;

  const response = await fetch(url, {
    ...init,
    headers: {
      Accept: "application/json",
      Authorization: buildAuthHeader(email, token),
      ...(init.body ? { "Content-Type": "application/json" } : {}),
      ...init.headers
    },
    cache: "no-store"
  });

  if (!response.ok) {
    let detail: string | undefined;
    try {
      const body = (await response.json()) as { errorMessages?: string[]; message?: string };
      detail = body.errorMessages?.join(" ") || body.message;
    } catch {
      detail = undefined;
    }
    throw new JiraApiError(jiraApiErrorMessage(response.status, detail), response.status);
  }

  return (await response.json()) as T;
}
