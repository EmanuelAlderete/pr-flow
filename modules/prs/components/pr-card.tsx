"use client";

import { useEffect, useState } from "react";
import type { MonitoredPr, PrSlackShareInfo } from "@/modules/prs/lib/domain";
import { PrAlertIcons } from "@/modules/prs/components/pr-alert-icons";
import { PrCardContextMenu } from "@/modules/prs/components/pr-card-context-menu";
import { PrCardSlackSharedBadge } from "@/modules/prs/components/pr-card-slack-shared-badge";
import { PrOpenDuration } from "@/modules/prs/components/pr-open-duration";
import { ReviewerListItem } from "@/modules/prs/components/reviewer-list-item";
import { usePrCardViewModel } from "@/modules/prs/lib/hooks/use-pr-card-view-model";
import { ptBR } from "@/modules/messages";
import { useWorkContext } from "@/modules/work-context/components/work-context-provider";

function LocalReviewBlock({ review }: { review: MonitoredPr["localReview"] }) {
  if (!review) {
    return null;
  }

  if (review.status === "running") {
    return <p className="small muted pr-local-review">{ptBR.localReview.running}</p>;
  }

  if (review.status === "error") {
    return (
      <p className="small muted pr-local-review">
        {ptBR.localReview.failed}
        {review.error ? ` — ${review.error}` : ""}
      </p>
    );
  }

  const findings = review.findings.slice(0, 8);

  return (
    <div className="pr-local-review">
      <details>
        <summary>{ptBR.localReview.summary(review.findings.length)}</summary>
        {review.summary ? <p className="small">{review.summary}</p> : null}
        {findings.length > 0 ? (
          <ul className="pr-local-review-findings">
            {findings.map((finding) => (
              <li key={`${finding.path}:${finding.line ?? 0}:${finding.message}`}>
                <span className="small">
                  {finding.path}
                  {finding.line ? `:${finding.line}` : ""} — {finding.message}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="small muted">{ptBR.localReview.clean}</p>
        )}
      </details>
      <p className="small muted">{ptBR.localReview.human}</p>
    </div>
  );
}

interface Props {
  pr: MonitoredPr;
  allOpenPrs?: MonitoredPr[];
  slackConfigured?: boolean;
}

export function PrCard({ pr, allOpenPrs = [], slackConfigured = false }: Props) {
  const vm = usePrCardViewModel(pr);
  const { openWorkContext } = useWorkContext();
  const [slackShare, setSlackShare] = useState<PrSlackShareInfo | null>(pr.slackShare ?? null);
  const useCompactApprovedLayout =
    !pr.readyToMerge && vm.statusGeral === "approved" && vm.avaliou.length > 0 && vm.pendente.length === 0;

  useEffect(() => {
    setSlackShare(pr.slackShare ?? null);
  }, [pr.slackShare]);

  return (
    <PrCardContextMenu
      allOpenPrs={allOpenPrs}
      jiraIssueKey={vm.jiraIssueKey}
      onSlackShareChange={setSlackShare}
      pr={{ ...pr, slackShare }}
      slackConfigured={slackConfigured}
      statusClass={vm.statusClass}
    >
      <header className="pr-header">
        <div className="pr-title-row">
          <div className="pr-meta">
            <a
              aria-label={`Abrir PR #${pr.number} no GitHub`}
              className="badge badge-link"
              href={vm.githubPrUrl}
              rel="noreferrer"
              target="_blank"
            >
              PR #{pr.number}
            </a>
            <PrOpenDuration createdAt={pr.createdAt} />
          </div>
          <div className="pr-meta-right">
            {slackShare ? <PrCardSlackSharedBadge slackShare={slackShare} /> : null}
            <PrAlertIcons impediments={vm.impediments} />
            {vm.shouldShowStatusPill && <span className={`status-pill ${vm.statusClass}`}>{vm.statusLabel}</span>}
          </div>
        </div>
        {vm.jiraIssueKey ? (
          <button
            aria-label={`Ver contexto de trabalho de ${vm.jiraIssueKey}`}
            className="pr-link pr-link-button"
            onClick={() => openWorkContext(vm.jiraIssueKey!)}
            type="button"
          >
            {pr.title}{" "}
            <span className="small muted">({pr.repository})</span>
          </button>
        ) : (
          <a
            aria-label="Abrir titulo da PR no GitHub"
            className="pr-link"
            href={vm.githubPrUrl}
            rel="noreferrer"
            target="_blank"
          >
            {pr.title}{" "}
            <span className="small muted">({pr.repository})</span>
          </a>
        )}
      </header>

      {useCompactApprovedLayout ? (
        <section className="grid-3">
          <section className="pr-reviewer-group">
            <h4>Quem já revisou</h4>
            <ul className="reviewer-list">
              {vm.avaliou.map((login) => (
                <ReviewerListItem key={login} login={login} reviewed />
              ))}
            </ul>
          </section>
        </section>
      ) : (
        <section className="pr-sections">
          <div className={vm.pendente.length > 0 ? "reviewers-duo reviewers-duo--split" : "reviewers-duo"}>
            <section className="pr-reviewer-group">
              <h4>Quem já revisou</h4>
              {vm.avaliou.length > 0 ? (
                <ul className="reviewer-list">
                  {vm.avaliou.map((login) => (
                    <ReviewerListItem key={login} login={login} reviewed />
                  ))}
                </ul>
              ) : (
                <p className="small muted">Ninguem revisou ainda</p>
              )}
            </section>

            {vm.pendente.length > 0 && (
              <section className="pr-reviewer-group">
                <h4>Quem falta revisar</h4>
                <ul className="reviewer-list">
                  {vm.pendente.map((login) => (
                    <ReviewerListItem key={login} login={login} reviewed={false} />
                  ))}
                </ul>
              </section>
            )}
          </div>

          {vm.solicitouAlteracoes.length > 0 && (
            <section className="pr-reviewer-group">
              <h4>Alterações solicitadas</h4>
              <div className="avatars">
                {vm.solicitouAlteracoes.map((login) => (
                  <span key={login} className="avatar changes" title={login}>
                    {login.charAt(0).toUpperCase()}
                  </span>
                ))}
              </div>
            </section>
          )}
        </section>
      )}

      {vm.statusGeral === "no_reviewers" && (
        <div className="no-reviewers-row">
          <span className="empty-dot">N</span>
          <p className="small muted">0 reviewers solicitados</p>
        </div>
      )}

      <LocalReviewBlock review={pr.localReview} />
    </PrCardContextMenu>
  );
}
