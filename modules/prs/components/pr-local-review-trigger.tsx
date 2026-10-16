"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import type { PrLocalReviewInfo } from "@/modules/prs/lib/domain";
import { ptBR } from "@/modules/messages";
import { PrLocalReviewStartDialog } from "@/modules/prs/components/pr-local-review-start-dialog";

export function PrLocalReviewTrigger({
  repository,
  prNumber,
  review,
  reviewInProgress = false,
  onStarted,
  className
}: {
  repository: string;
  prNumber: number;
  review?: PrLocalReviewInfo | null;
  reviewInProgress?: boolean;
  onStarted?: () => void;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  if (review?.status === "running") {
    return null;
  }

  const label =
    review?.status === "error"
      ? ptBR.localReview.retry
      : review?.status === "ok"
        ? ptBR.localReview.again
        : ptBR.localReview.trigger;

  return (
    <div className={className}>
      <Button
        type="button"
        size="sm"
        variant={review?.status === "error" ? "default" : "outline"}
        disabled={reviewInProgress}
        onClick={() => setOpen(true)}
      >
        {label}
      </Button>
      <PrLocalReviewStartDialog
        open={open}
        onOpenChange={setOpen}
        onStarted={onStarted}
        prNumber={prNumber}
        repository={repository}
      />
    </div>
  );
}
