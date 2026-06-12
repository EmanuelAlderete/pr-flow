"use client";

import type { Components } from "react-markdown";
import ReactMarkdown from "react-markdown";
import rehypeSanitize from "rehype-sanitize";
import { linkifyJiraIssueKeysInMarkdown } from "@/modules/jira-issue-key";
import { JiraIssueLink } from "@/modules/work-context/components/jira-issue-link";
import { cn } from "@/lib/utils";

type NotePreviewProps = {
  markdown: string;
};

const previewProseClass = cn(
  "note-preview prose prose-sm dark:prose-invert max-w-none",
  "rounded-xl border border-[var(--app-border)] p-4 md:p-5",
  "bg-[var(--app-surface-inset)] text-[var(--app-text)]",
  "prose-headings:text-[var(--app-text)] prose-headings:font-semibold",
  "prose-p:text-[var(--app-text-soft)] prose-li:text-[var(--app-text-soft)]",
  "prose-strong:text-[var(--app-text)]",
  "prose-a:text-[var(--app-link)] prose-a:underline-offset-2 hover:prose-a:underline",
  "prose-code:text-[var(--brand-bright)] prose-code:before:content-none prose-code:after:content-none",
  "prose-pre:border prose-pre:border-[var(--app-border)] prose-pre:bg-black/30",
  "prose-blockquote:border-[var(--brand-border)] prose-blockquote:text-[var(--app-text-muted)]",
  "prose-hr:border-[var(--app-border)]",
  "prose-th:text-[var(--app-text)] prose-td:text-[var(--app-text-soft)]"
);

function issueKeyFromJiraHref(href: string | undefined): string | null {
  if (!href?.startsWith("/jira")) {
    return null;
  }
  try {
    const url = new URL(href, "http://local");
    return url.searchParams.get("issue");
  } catch {
    return null;
  }
}

const markdownComponents: Components = {
  a: ({ href, children, ...props }) => {
    const issueKey = issueKeyFromJiraHref(href);
    if (issueKey) {
      return <JiraIssueLink issueKey={issueKey}>{children}</JiraIssueLink>;
    }

    return (
      <a href={href} target="_blank" rel="noopener noreferrer" {...props}>
        {children}
      </a>
    );
  }
};

export function NotePreview({ markdown }: NotePreviewProps) {
  const isEmpty = markdown.trim().length === 0;

  if (isEmpty) {
    return (
      <p
        className="rounded-lg border border-dashed border-[var(--app-border-strong)] bg-[var(--app-surface-inset)] px-4 py-8 text-center text-sm text-[var(--app-text-muted)]"
        data-testid="note-preview-empty"
      >
        Nada para exibir — a nota está vazia.
      </p>
    );
  }

  const linkedMarkdown = linkifyJiraIssueKeysInMarkdown(markdown);

  return (
    <div className={previewProseClass} data-testid="note-preview">
      <ReactMarkdown rehypePlugins={[rehypeSanitize]} components={markdownComponents}>
        {linkedMarkdown}
      </ReactMarkdown>
    </div>
  );
}
