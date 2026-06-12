"use client";

import { usePrOpenDuration } from "@/modules/prs/hooks/use-pr-open-duration";

interface Props {
  createdAt: string;
}

export function PrOpenDuration({ createdAt }: Props) {
  const label = usePrOpenDuration(createdAt);

  return (
    <span aria-live="polite" className="small muted">
      {label}
    </span>
  );
}
