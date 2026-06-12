import { extractJiraIssueKey, getJiraBrowseUrl } from "@/modules/jira-issue-key";
import { resolveSlackTicketChannelLabel } from "@/modules/prs/lib/core/pr-slack-related";

export function buildSlackPrChannelText(channelLabel: string, issueKey: string): string {
  return `${channelLabel.trim()} - ${getJiraBrowseUrl(issueKey)}`;
}

export function buildSlackPrThreadText(prUrls: string[]): string {
  const uniqueUrls = [...new Set(prUrls.map((url) => url.trim()).filter(Boolean))];
  return uniqueUrls.map((url) => `- ${url}`).join("\n");
}

export function resolveSlackPrShare(input: {
  channelLabel: string;
  issueKey: string;
  prUrls: string[];
}): {
  issueKey: string;
  channelText: string;
  threadText: string;
} | null {
  const issueKey = input.issueKey.trim().toUpperCase();
  if (!issueKey || input.prUrls.length === 0) {
    return null;
  }

  const channelLabel = input.channelLabel.trim();
  if (!channelLabel) {
    return null;
  }

  return {
    issueKey,
    channelText: buildSlackPrChannelText(channelLabel, issueKey),
    threadText: buildSlackPrThreadText(input.prUrls)
  };
}

export function resolveSlackPrShareFromTitle(input: {
  title: string;
  prUrls: string[];
}): ReturnType<typeof resolveSlackPrShare> {
  const issueKey = extractJiraIssueKey(input.title);
  if (!issueKey) {
    return null;
  }

  return resolveSlackPrShare({
    issueKey,
    channelLabel: resolveSlackTicketChannelLabel(input.title, issueKey),
    prUrls: input.prUrls
  });
}
