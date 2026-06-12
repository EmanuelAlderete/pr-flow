/** Extrai JOR-123 de nomes de branch (ex.: feat/jor-123/descricao, fix/JOR-9/x). */
const BRANCH_JIRA_SEGMENT_PATTERN = /(?:^|\/)jor-(\d+)(?:\/|$)/i;

export function extractJiraIssueKeyFromBranch(branch: string): string | null {
  const match = branch.trim().match(BRANCH_JIRA_SEGMENT_PATTERN);
  if (!match) {
    return null;
  }
  return `JOR-${match[1]}`;
}
