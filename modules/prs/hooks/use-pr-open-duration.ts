"use client";

import { useEffect, useState } from "react";
import { formatPrOpenDuration } from "@/modules/prs/lib/core/format-pr-open-duration";

export function usePrOpenDuration(createdAt: string) {
  const [label, setLabel] = useState(() => formatPrOpenDuration(createdAt));

  useEffect(() => {
    const update = () => setLabel(formatPrOpenDuration(createdAt));
    update();
    const timer = window.setInterval(update, 1000);
    return () => window.clearInterval(timer);
  }, [createdAt]);

  return label;
}
