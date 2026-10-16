"use client";

import { useState } from "react";
import ReactMarkdown from "react-markdown";
import rehypeSanitize from "rehype-sanitize";
import {
  BookOpen,
  Bug,
  ChevronDown,
  FileCode,
  FlaskConical,
  ListChecks,
  ScanSearch,
  Shield,
  ShieldCheck,
  type LucideIcon
} from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger
} from "@/components/ui/accordion";
import { linkifyJiraIssueKeysInMarkdown } from "@/modules/jira-issue-key";
import { ptBR } from "@/modules/messages";
import type { LocalReviewView } from "@/modules/prs/lib/local-review/local-review-markdown";
import { cn } from "@/lib/utils";

const AGENT_ICONS: Record<string, LucideIcon> = {
  correctness: Bug,
  security: Shield,
  contracts: FileCode,
  tests: FlaskConical,
  delivery: ListChecks,
  conventions: BookOpen,
  "second-pass": ScanSearch,
  "meta-review": ShieldCheck
};

const proseClass = cn(
  "prose prose-sm dark:prose-invert max-w-none",
  "text-[var(--app-text)]",
  "prose-headings:text-[var(--app-text)] prose-headings:font-semibold",
  "prose-p:my-2 prose-p:text-[var(--app-text-soft)] prose-li:text-[var(--app-text-soft)]",
  "prose-strong:text-[var(--app-text)]",
  "prose-a:text-[var(--app-link)] prose-a:underline-offset-2 hover:prose-a:underline",
  "prose-code:rounded prose-code:bg-black/30 prose-code:px-1 prose-code:py-0.5 prose-code:text-[var(--brand-bright)] prose-code:before:content-none prose-code:after:content-none",
  "prose-pre:overflow-x-auto prose-pre:border prose-pre:border-[var(--app-border)] prose-pre:bg-black/30",
  "prose-blockquote:border-[var(--brand-border)] prose-blockquote:text-[var(--app-text-muted)]",
  "break-words"
);

export function PrLocalReviewBoard({ view }: { view: LocalReviewView }) {
  const [openAgents, setOpenAgents] = useState<string[]>([]);

  return (
    <div className="space-y-4">
      <section className="panel p-5 md:p-6">
        <h2 className="text-lg font-semibold text-[var(--app-text)]">{ptBR.localReview.summaryHeading}</h2>
        <ReviewMarkdown markdown={view.summary} />
        <div className="mt-4">
        <FoldCard title={ptBR.localReview.docsHeading} meta={`${view.docsLoaded.length}`}>
          <ul className="flex flex-wrap gap-2">
            {view.docsLoaded.map((doc) => (
              <li
                key={doc}
                className="rounded-md bg-black/20 px-2 py-1 font-mono text-xs text-[var(--app-text-soft)]"
              >
                {doc}
              </li>
            ))}
          </ul>
        </FoldCard>
        </div>
      </section>

      <Accordion
        multiple
        value={openAgents}
        onValueChange={setOpenAgents}
        aria-label={ptBR.localReview.agentsHeading}
        className="gap-3"
      >
        {view.agents.map((agent) => {
          const Icon = AGENT_ICONS[agent.id] ?? Shield;
          return (
            <AccordionItem key={agent.id} value={agent.id}>
              <AccordionTrigger>
                <span className="flex min-w-0 flex-1 items-start gap-3">
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-[var(--brand-dim)] text-[var(--brand-bright)]">
                    <Icon className="size-4" aria-hidden />
                  </span>
                  <span className="min-w-0 text-left">
                    <span className="flex items-center gap-2">
                      <span className="font-semibold text-[var(--app-text)]">{agent.title}</span>
                      {agent.findings.length > 0 ? (
                        <span className="tabular-nums text-xs text-[var(--brand-bright)]">
                          {agent.findings.length}
                        </span>
                      ) : null}
                    </span>
                    {agent.description ? (
                      <span className="mt-0.5 block text-sm font-normal text-[var(--app-text-muted)]">
                        {agent.description}
                      </span>
                    ) : null}
                    {!agent.wide ? (
                      <span className="mt-1 block text-sm font-normal text-[var(--app-text-muted)]">
                        {ptBR.localReview.agentEmpty}
                      </span>
                    ) : null}
                  </span>
                </span>
              </AccordionTrigger>
              <AccordionContent>
                {!agent.wide ? (
                  <p className="text-sm text-[var(--app-text-muted)]">{ptBR.localReview.agentEmpty}</p>
                ) : (
                  <div className="space-y-2">
                    {agent.note ? (
                      <FoldCard title={ptBR.localReview.noteLabel} preview={preview(agent.note)}>
                        <ReviewMarkdown markdown={agent.note} />
                      </FoldCard>
                    ) : null}
                    {agent.findings.map((finding) => (
                      <FoldCard
                        key={`${finding.location}:${finding.message}`}
                        title={finding.location}
                        meta={finding.confidenceLabel}
                        titleClassName="font-mono text-xs"
                      >
                        {finding.href ? (
                          <a
                            href={finding.href}
                            target="_blank"
                            rel="noreferrer"
                            className="font-mono text-xs break-all text-[var(--app-link)] underline-offset-2 hover:underline"
                          >
                            {finding.location}
                          </a>
                        ) : null}
                        <ReviewMarkdown markdown={finding.message} />
                      </FoldCard>
                    ))}
                    {agent.checks?.map((check) => (
                      <FoldCard
                        key={`${check.status}:${check.item}`}
                        title={check.label}
                        preview={preview(check.item)}
                      >
                        <ReviewMarkdown markdown={check.item} />
                      </FoldCard>
                    ))}
                    {agent.listTitle ? (
                      <div className="space-y-2 pt-1">
                        <h3 className="px-1 text-sm font-semibold text-[var(--app-text)]">{agent.listTitle}</h3>
                        {agent.list && agent.list.length > 0 ? (
                          agent.list.map((item) => (
                            <FoldCard key={item} title={preview(item, 96)}>
                              <ReviewMarkdown markdown={item} />
                            </FoldCard>
                          ))
                        ) : (
                          <p className="px-1 text-sm text-[var(--app-text-muted)]">{ptBR.localReview.droppedNone}</p>
                        )}
                      </div>
                    ) : null}
                  </div>
                )}
              </AccordionContent>
            </AccordionItem>
          );
        })}
      </Accordion>
    </div>
  );
}

function FoldCard({
  title,
  meta,
  preview: previewText,
  titleClassName,
  children
}: {
  title: string;
  meta?: string;
  preview?: string;
  titleClassName?: string;
  children: React.ReactNode;
}) {
  return (
    <details className="group rounded-lg border border-[var(--app-border)] bg-[var(--app-surface-inset)]">
      <summary className="flex cursor-pointer list-none items-center gap-2 px-3 py-2.5 [&::-webkit-details-marker]:hidden">
        <span className="flex min-w-0 flex-1 items-baseline gap-2">
          <span
            className={cn(
              "min-w-0 truncate text-sm text-[var(--app-text)]",
              previewText ? "max-w-[11rem] shrink-0" : "flex-1",
              titleClassName
            )}
          >
            {title}
          </span>
          {previewText ? (
            <span className="hidden min-w-0 flex-1 truncate text-sm text-[var(--app-text-muted)] sm:block">
              {previewText}
            </span>
          ) : null}
        </span>
        {meta ? <span className="shrink-0 text-xs text-[var(--app-text-muted)]">{meta}</span> : null}
        <ChevronDown className="size-4 shrink-0 text-[var(--app-text-muted)] transition-transform duration-200 group-open:rotate-180" />
      </summary>
      <div className="border-t border-[var(--app-border)] px-3 py-2">{children}</div>
    </details>
  );
}

function ReviewMarkdown({ markdown }: { markdown: string }) {
  return (
    <div className={proseClass}>
      <ReactMarkdown rehypePlugins={[rehypeSanitize]}>
        {linkifyJiraIssueKeysInMarkdown(markdown)}
      </ReactMarkdown>
    </div>
  );
}

function preview(markdown: string, max = 72): string {
  const plain = markdown
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/[`*_>#]/g, "")
    .replace(/\s+/g, " ")
    .trim();
  if (plain.length <= max) {
    return plain;
  }
  return `${plain.slice(0, max).trim()}…`;
}
