const JIRA_ISSUE_PATTERN = /\b(JOR-\d+)\b/i;
const BARE_JIRA_ISSUE_KEY_PATTERN = /\bJOR-\d+\b/gi;
const MARKDOWN_LINK_PATTERN = /\[[^\]]*]\([^)]*\)/g;
const JIRA_BROWSE_BASE_URL = "https://jusfy.atlassian.net/browse";

export function extractJiraIssueKey(title: string): string | null {
  const match = title.trim().match(JIRA_ISSUE_PATTERN);
  if (!match) {
    return null;
  }
  return match[1].toUpperCase();
}

export function normalizeJiraIssueKey(input: string): string {
  return extractJiraIssueKey(input) ?? input.trim().toUpperCase();
}

export function getJiraBrowseUrl(issueKey: string): string {
  return `${JIRA_BROWSE_BASE_URL}/${issueKey}`;
}

/** Rota interna do app para abrir o ticket na página Jira (com diálogo de detalhe). */
export function getJiraAppIssueHref(issueKey: string): string {
  return `/jira?issue=${encodeURIComponent(normalizeJiraIssueKey(issueKey))}`;
}

function linkifyBareJiraKeysInText(text: string): string {
  const protectedLinks: string[] = [];
  const withPlaceholders = text.replace(MARKDOWN_LINK_PATTERN, (link) => {
    const index = protectedLinks.length;
    protectedLinks.push(link);
    return `\x00MDLINK${index}\x00`;
  });

  const linkified = withPlaceholders.replace(BARE_JIRA_ISSUE_KEY_PATTERN, (match) => {
    const key = match.toUpperCase();
    return `[${key}](${getJiraAppIssueHref(key)})`;
  });

  return linkified.replace(/\x00MDLINK(\d+)\x00/g, (_, index) => protectedLinks[Number(index)] ?? "");
}

function linkifyInlineCodeAware(text: string): string {
  const parts = text.split(/(`[^`\n]+`)/g);
  return parts
    .map((part, index) => (index % 2 === 1 ? part : linkifyBareJiraKeysInText(part)))
    .join("");
}

/** Converte menções JOR-123 em links para `/jira?issue=…` (ignora blocos e inline code). */
export function linkifyJiraIssueKeysInMarkdown(markdown: string): string {
  const segments = markdown.split(/(```[\s\S]*?```)/g);
  return segments
    .map((segment, index) => (index % 2 === 1 ? segment : linkifyInlineCodeAware(segment)))
    .join("");
}

export function resolvePrTitleHref(title: string, fallbackUrl: string): string {
  const issueKey = extractJiraIssueKey(title);
  if (!issueKey) {
    return fallbackUrl;
  }
  return getJiraBrowseUrl(issueKey);
}
