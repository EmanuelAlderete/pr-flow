"use client";

import { ChevronRight, ExternalLink, GitPullRequest } from "lucide-react";
import { PrLocalReviewBlock } from "@/modules/prs/components/pr-local-review-block";
import { PrLocalReviewTrigger } from "@/modules/prs/components/pr-local-review-trigger";
import type { ReviewerQueuePr } from "@/modules/prs/lib/domain";
import { myReviewStatusLabel } from "@/modules/prs/lib/core/my-review-status";
import {
  reviewQueueCardClass,
  reviewQueueStatusPillClass
} from "@/modules/prs/lib/review-queue-status";
import { cn } from "@/lib/utils";

interface Props {
  pr: ReviewerQueuePr;
  reviewInProgress?: boolean;
  onStarted?: () => void;
}

function formatRepository(repository: string): string {
  const slashIndex = repository.lastIndexOf("/");
  if (slashIndex === -1) {
    return repository;
  }
  return repository.slice(slashIndex + 1);
}

export function PrReviewerQueueItem({ pr, reviewInProgress = false, onStarted }: Props) {
  const statusClass = reviewQueueCardClass(pr.myReviewStatus);

  return (
    <li>
      <article className={cn("review-queue-card panel", statusClass)}>
        <div className="review-queue-card__row">
          <a
            className="review-queue-card__main"
            href={pr.url}
            rel="noreferrer"
            target="_blank"
            aria-label={`Abrir PR #${pr.number}: ${pr.title}`}
          >
            <header className="review-queue-card__header">
              <p className="review-queue-card__repo">
                <GitPullRequest className="size-3.5 shrink-0" aria-hidden />
                <span>{formatRepository(pr.repository)}</span>
                <span className="review-queue-card__number">#{pr.number}</span>
              </p>
              <span className={cn("review-queue-card__status", reviewQueueStatusPillClass(pr.myReviewStatus))}>
                {myReviewStatusLabel(pr.myReviewStatus)}
              </span>
            </header>

            <h3 className="review-queue-card__title">{pr.title}</h3>

            <span className="review-queue-card__cta">
              Abrir no GitHub
              <ChevronRight className="size-4" aria-hidden />
            </span>
          </a>

          <a
            href={pr.url}
            target="_blank"
            rel="noopener noreferrer"
            className="review-queue-card__external"
            aria-label={`Abrir PR #${pr.number} no GitHub`}
            onClick={(event) => event.stopPropagation()}
          >
            <ExternalLink className="size-4" aria-hidden />
          </a>
        </div>
        <PrLocalReviewBlock review={pr.localReview} repository={pr.repository} prNumber={pr.number} />
        <PrLocalReviewTrigger
          className="review-queue-card__actions"
          prNumber={pr.number}
          repository={pr.repository}
          review={pr.localReview}
          reviewInProgress={reviewInProgress}
          onStarted={onStarted}
        />
      </article>
    </li>
  );
}
