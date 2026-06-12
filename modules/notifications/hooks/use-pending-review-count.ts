"use client";

import { useCallback, useEffect, useState } from "react";
import { PR_MONITOR_SYNC_UPDATED_EVENT } from "@/modules/prs/lib/pr-monitor-cache";
import { countPendingReviews } from "@/modules/notifications/hooks/use-pr-notification-sync";

export function usePendingReviewCount(): number {
  const [count, setCount] = useState(0);

  const syncFromCache = useCallback(() => {
    setCount(countPendingReviews());
  }, []);

  useEffect(() => {
    syncFromCache();

    const onSyncUpdated = () => {
      syncFromCache();
    };

    window.addEventListener(PR_MONITOR_SYNC_UPDATED_EVENT, onSyncUpdated);
    return () => window.removeEventListener(PR_MONITOR_SYNC_UPDATED_EVENT, onSyncUpdated);
  }, [syncFromCache]);

  return count;
}
