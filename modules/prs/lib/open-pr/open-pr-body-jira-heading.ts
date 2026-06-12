import { extractJiraIssueKey, getJiraBrowseUrl } from "@/modules/jira-issue-key";

export function buildOpenPrBodyJiraHeading(title: string): string | null {
  const trimmedTitle = title.trim();
  const issueKey = extractJiraIssueKey(trimmedTitle);
  if (!issueKey || trimmedTitle.length === 0) {
    return null;
  }

  return `# [${trimmedTitle}](${getJiraBrowseUrl(issueKey)})`;
}

function isMarkdownLevel1Heading(line: string): boolean {
  return /^#\s+/.test(line) && !/^##/.test(line);
}

/** Garante que o primeiro H1 do corpo siga o template `[título](url-jira)`. */
export function ensureOpenPrBodyJiraHeadingLink(body: string, title: string): string {
  const linkedHeading = buildOpenPrBodyJiraHeading(title);
  if (!linkedHeading) {
    return body;
  }

  const trimmedTitle = title.trim();
  const issueKey = extractJiraIssueKey(trimmedTitle)!;
  const jiraUrl = getJiraBrowseUrl(issueKey);

  const trimmedBody = body.trimStart();
  const leadingWhitespace = body.slice(0, body.length - trimmedBody.length);
  const lines = trimmedBody.split(/\r?\n/);
  const firstLine = lines[0] ?? "";

  const linkedMatch = firstLine.match(/^#\s+\[([^\]]+)\]\(([^)]+)\)\s*$/);
  if (linkedMatch) {
    const [, linkText, url] = linkedMatch;
    if (url === jiraUrl && linkText.trim() === trimmedTitle) {
      return body;
    }
    lines[0] = linkedHeading;
    return leadingWhitespace + lines.join("\n");
  }

  if (isMarkdownLevel1Heading(firstLine)) {
    const h1Text = firstLine.replace(/^#\s+/, "").trim();
    if (h1Text === trimmedTitle || h1Text.toUpperCase().includes(issueKey)) {
      lines[0] = linkedHeading;
      return leadingWhitespace + lines.join("\n");
    }
    return body;
  }

  return `${linkedHeading}\n\n${trimmedBody}`;
}
