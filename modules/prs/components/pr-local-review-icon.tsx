import Link from "next/link";
import { Loader2, ScanSearch } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import type { PrLocalReviewInfo } from "@/modules/prs/lib/domain";
import { localReviewPath } from "@/modules/prs/lib/local-review/local-review-markdown";
import { ptBR } from "@/modules/messages";

export function PrLocalReviewStatusIcon({
  review,
  repository,
  prNumber
}: {
  review?: PrLocalReviewInfo | null;
  repository: string;
  prNumber: number;
}) {
  const href = localReviewPath(repository, prNumber);
  if (!review || !href) {
    return null;
  }

  if (review.status === "running") {
    return (
      <Tooltip>
        <TooltipTrigger
          render={
            <span aria-label={ptBR.localReview.running} className="pr-alert-icon pr-local-review-icon" role="status">
              <Loader2 className="impediment-icon-svg animate-spin" aria-hidden />
            </span>
          }
        />
        <TooltipContent>{ptBR.localReview.running}</TooltipContent>
      </Tooltip>
    );
  }

  const label = ptBR.localReview.read;

  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Link aria-label={label} className="pr-alert-icon pr-local-review-icon" href={href}>
            <ScanSearch className="impediment-icon-svg" aria-hidden />
          </Link>
        }
      />
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}
