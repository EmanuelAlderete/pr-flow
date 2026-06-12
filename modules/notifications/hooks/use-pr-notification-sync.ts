"use client";

import { useCallback, useEffect, useRef } from "react";
import type { MonitoredPr, PrApiResponse, ReviewerQueueApiResponse, ReviewerQueuePr } from "@/modules/prs/lib/domain";
import {
  loadPrMonitorLastSync,
  PR_MONITOR_SYNC_UPDATED_EVENT,
  savePrMonitorLastSync
} from "@/modules/prs/lib/pr-monitor-cache";
import {
  loadPrReviewerQueueLastSync,
  savePrReviewerQueueLastSync
} from "@/modules/prs/lib/pr-reviewer-queue-cache";
import { loadNotificationPreferences } from "@/modules/notifications/lib/notification-preferences";
import {
  detectPrMonitorAlerts,
  detectReviewerQueueAlerts,
  type PrAlertEvent
} from "@/modules/notifications/lib/pr-alert-events";

const POLL_INTERVAL_MS = 2 * 60 * 1000;

async function fetchMonitor(): Promise<PrApiResponse | null> {
  try {
    const result = await fetch("/api/prs", { method: "GET", cache: "no-store" });
    const body = (await result.json()) as PrApiResponse;
    if (result.ok && body.status === "ok") {
      savePrMonitorLastSync(body);
    }
    return body;
  } catch {
    return null;
  }
}

async function fetchReviewerQueue(): Promise<ReviewerQueueApiResponse | null> {
  try {
    const result = await fetch("/api/prs/reviewer-queue", { method: "GET", cache: "no-store" });
    const body = (await result.json()) as ReviewerQueueApiResponse;
    if (result.ok && body.status === "ok") {
      savePrReviewerQueueLastSync(body);
    }
    return body;
  } catch {
    return null;
  }
}

export function usePrNotificationSync(deliverAlert: (event: PrAlertEvent) => void) {
  const monitorRef = useRef<MonitoredPr[] | null>(null);
  const queueRef = useRef<ReviewerQueuePr[] | null>(null);
  const deliverRef = useRef(deliverAlert);

  deliverRef.current = deliverAlert;

  const evaluateAlerts = useCallback(() => {
    const preferences = loadNotificationPreferences();
    const monitor = loadPrMonitorLastSync();
    const queue = loadPrReviewerQueueLastSync();

    if (monitor?.status === "ok") {
      const alerts = detectPrMonitorAlerts(monitorRef.current, monitor.data, preferences);
      for (const alert of alerts) {
        deliverRef.current(alert);
      }
      monitorRef.current = monitor.data;
    }

    if (queue?.status === "ok") {
      const alerts = detectReviewerQueueAlerts(queueRef.current, queue.data, preferences);
      for (const alert of alerts) {
        deliverRef.current(alert);
      }
      queueRef.current = queue.data;
    }
  }, []);

  const syncAll = useCallback(async () => {
    await Promise.all([fetchMonitor(), fetchReviewerQueue()]);
    evaluateAlerts();
  }, [evaluateAlerts]);

  useEffect(() => {
    const cachedMonitor = loadPrMonitorLastSync();
    const cachedQueue = loadPrReviewerQueueLastSync();
    monitorRef.current = cachedMonitor?.status === "ok" ? cachedMonitor.data : null;
    queueRef.current = cachedQueue?.status === "ok" ? cachedQueue.data : null;

    void syncAll();

    const onSyncUpdated = () => {
      evaluateAlerts();
    };

    const intervalId = window.setInterval(() => {
      void syncAll();
    }, POLL_INTERVAL_MS);

    window.addEventListener(PR_MONITOR_SYNC_UPDATED_EVENT, onSyncUpdated);
    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener(PR_MONITOR_SYNC_UPDATED_EVENT, onSyncUpdated);
    };
  }, [evaluateAlerts, syncAll]);
}

export function countPendingReviews(): number {
  const queue = loadPrReviewerQueueLastSync();
  if (queue?.status !== "ok") {
    return 0;
  }

  return queue.data.filter((pr) => pr.myReviewStatus === "pending").length;
}
