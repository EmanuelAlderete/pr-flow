export const JIRA_SITE_ORIGIN = "https://jusfy.atlassian.net";

export function getJiraSiteOrigin(): string {
  const fromEnv = process.env.JIRA_SITE_URL?.trim().replace(/\/$/, "");
  return fromEnv || JIRA_SITE_ORIGIN;
}

export function getJiraApiBaseUrl(): string {
  return `${getJiraSiteOrigin()}/rest/api/3`;
}

export function getJiraEmail(): string | null {
  const email = process.env.JIRA_EMAIL?.trim();
  return email ? email : null;
}

export function getJiraToken(): string | null {
  const token = process.env.JIRA_TOKEN?.trim();
  return token ? token : null;
}

/** Projeto usado para descobrir o board Scrum das sprints (padrão JOR). */
export function getJiraSprintProjectKey(): string {
  return process.env.JIRA_SPRINT_PROJECT_KEY?.trim() || "JOR";
}

/** Se definido, ignora a descoberta automática de board. */
export function getJiraSprintBoardIdOverride(): number | null {
  const raw = process.env.JIRA_SPRINT_BOARD_ID?.trim();
  if (!raw) {
    return null;
  }
  const id = Number(raw);
  return Number.isFinite(id) && id > 0 ? id : null;
}

export function isJiraConfigured(): boolean {
  return Boolean(getJiraEmail() && getJiraToken());
}

export function getJiraCredentials(): { email: string; token: string } {
  const email = getJiraEmail();
  const token = getJiraToken();

  if (!email || !token) {
    throw new JiraConfigError(
      "Configure JIRA_EMAIL e JIRA_TOKEN no .env para usar a integração com o Jira."
    );
  }

  return { email, token };
}

export class JiraConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "JiraConfigError";
  }
}
