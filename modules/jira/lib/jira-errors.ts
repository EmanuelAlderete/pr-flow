export class JiraApiError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "JiraApiError";
    this.status = status;
  }
}

export function jiraApiErrorMessage(status: number, detail?: string): string {
  if (status === 401 || status === 403) {
    return "Credenciais do Jira inválidas ou sem permissão. Verifique JIRA_EMAIL e JIRA_TOKEN.";
  }
  if (status === 429) {
    return "Limite de requisições do Jira atingido. Tente novamente em instantes.";
  }
  if (detail?.trim()) {
    return detail.trim();
  }
  return `Falha ao consultar o Jira (HTTP ${status}).`;
}
