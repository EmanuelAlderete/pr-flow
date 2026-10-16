import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";
import { buttonVariants } from "@/components/ui/button";
import { Surface } from "@/components/ui/surface";
import { ptBR } from "@/modules/messages";
import { PrLocalReviewBoard } from "@/modules/prs/components/pr-local-review-board";
import { PrLocalReviewUsage } from "@/modules/prs/components/pr-local-review-usage";
import { modelDisplayName } from "@/modules/prs/lib/local-review/local-review-usage";
import { buildLocalReviewView } from "@/modules/prs/lib/local-review/local-review-markdown";
import type { LocalReviewReading } from "@/modules/prs/lib/local-review/local-review-reading";

export function PrLocalReviewPage({ reading }: { reading: LocalReviewReading | null }) {
  const title = reading?.title ?? (reading ? `#${reading.prNumber}` : "Revisão local");
  const repo = reading ? reading.repository.slice(reading.repository.lastIndexOf("/") + 1) : null;
  const view =
    reading?.report && reading.headSha
      ? buildLocalReviewView(reading.report, {
          repository: reading.repository,
          headSha: reading.headSha
        })
      : null;

  return (
    <div className="app-shell">
      <PageHeader
        title={title}
        description={ptBR.localReview.human}
        actions={
          reading?.url ? (
            <Link
              href={reading.url}
              target="_blank"
              rel="noreferrer"
              className={buttonVariants({ variant: "outline", size: "sm" })}
            >
              {ptBR.localReview.openOnGitHub}
            </Link>
          ) : null
        }
      />

      {!reading ? (
        <Surface variant="dashed" className="p-4">
          <p className="text-sm text-[var(--app-text-muted)]">{ptBR.localReview.missingPage}</p>
        </Surface>
      ) : (
        <div className="mx-auto w-full max-w-6xl space-y-6">
          <p className="text-sm text-[var(--app-text-muted)]">
            {repo} #{reading.prNumber}
            {" · "}
            <span className="font-mono">{reading.headSha.slice(0, 7)}</span>
            {reading.finishedAt ? ` · ${formatFinished(reading.finishedAt)}` : null}
            {reading.model ? ` · ${modelDisplayName(reading.model)}` : null}
          </p>

          {reading.usage ? <PrLocalReviewUsage usage={reading.usage} /> : null}

          {reading.status === "running" ? (
            <Surface className="p-4">
              <p className="text-sm">{ptBR.localReview.running}</p>
            </Surface>
          ) : null}

          {reading.status === "error" ? (
            <Surface className="p-4">
              <p className="text-sm text-[var(--app-text-muted)]">
                {ptBR.localReview.failed}
                {reading.error ? ` — ${reading.error}` : ""}
              </p>
            </Surface>
          ) : null}

          {view ? <PrLocalReviewBoard view={view} /> : null}
        </div>
      )}
    </div>
  );
}

function formatFinished(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return iso;
  }
  return date.toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
}
