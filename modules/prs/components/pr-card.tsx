"use client";

import { useEffect, useState } from "react";
import type { MonitoredPr, PrSlackShareInfo } from "@/modules/prs/lib/domain";
import { PrAlertIcons } from "@/modules/prs/components/pr-alert-icons";
import { PrCardContextMenu } from "@/modules/prs/components/pr-card-context-menu";
import { PrCardSlackSharedBadge } from "@/modules/prs/components/pr-card-slack-shared-badge";
import { PrLocalReviewStatusIcon } from "@/modules/prs/components/pr-local-review-icon";
import { PrOpenDuration } from "@/modules/prs/components/pr-open-duration";
import { ReviewerListItem } from "@/modules/prs/components/reviewer-list-item";
import { usePrCardViewModel } from "@/modules/prs/lib/hooks/use-pr-card-view-model";
import { useWorkContext } from "@/modules/work-context/components/work-context-provider";

interface Props {
  pr: MonitoredPr;
  allOpenPrs?: MonitoredPr[];
  slackConfigured?: boolean;
  reviewInProgress?: boolean;
  onReviewStarted?: () => void;
}

export function PrCard({
  pr,
  allOpenPrs = [],
  slackConfigured = false,
  reviewInProgress = false,
  onReviewStarted
}: Props) {
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
      onReviewStarted={onReviewStarted}
      onSlackShareChange={setSlackShare}
      pr={{ ...pr, slackShare }}
      reviewInProgress={reviewInProgress}
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
            <PrLocalReviewStatusIcon prNumber={pr.number} repository={pr.repository} review={pr.localReview} />
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

        </section>
      )}

      {vm.statusGeral === "no_reviewers" && (
        <div className="no-reviewers-row">
          <span className="empty-dot">N</span>
          <p className="small muted">0 reviewers solicitados</p>
        </div>
      )}

    </PrCardContextMenu>
  );
}
