"use client";

import type { ReactNode } from "react";
import { normalizeJiraIssueKey } from "@/modules/jira-issue-key";
import { useWorkContext } from "@/modules/work-context/components/work-context-provider";

type Props = {
  issueKey: string;
  children: ReactNode;
};

export function JiraIssueLink({ issueKey, children }: Props) {
  const { openWorkContext } = useWorkContext();
  const normalized = normalizeJiraIssueKey(issueKey);

  return (
    <button
      type="button"
      className="inline text-[var(--app-link)] underline-offset-2 hover:underline"
      data-jira-issue-link
      onClick={() => openWorkContext(normalized)}
    >
      {children}
    </button>
  );
}
