import { afterEach, describe, expect, it } from "vitest";
import {
  clearNotificationPreferences,
  DEFAULT_NOTIFICATION_PREFERENCES,
  isAlertTypeEnabled,
  loadNotificationPreferences,
  saveNotificationPreferences,
  type NotificationAlertType
} from "@/modules/notifications/lib/notification-preferences";

describe("notification preferences", () => {
  afterEach(() => {
    clearNotificationPreferences();
  });

  it("returns defaults when nothing is stored", () => {
    expect(loadNotificationPreferences()).toEqual(DEFAULT_NOTIFICATION_PREFERENCES);
  });

  it("persists toggles and stale threshold", () => {
    saveNotificationPreferences({
      ...DEFAULT_NOTIFICATION_PREFERENCES,
      alerts: {
        ...DEFAULT_NOTIFICATION_PREFERENCES.alerts,
        prApproved: false,
        prStale: true
      },
      staleDaysThreshold: 5
    });

    const loaded = loadNotificationPreferences();
    expect(loaded.alerts.prApproved).toBe(false);
    expect(loaded.alerts.prStale).toBe(true);
    expect(loaded.staleDaysThreshold).toBe(5);
  });

  it("reports whether a given alert type is enabled", () => {
    const prefs = loadNotificationPreferences();
    expect(isAlertTypeEnabled(prefs, "reviewerQueueNew")).toBe(true);
    expect(isAlertTypeEnabled(prefs, "prStale")).toBe(false);
  });

  it("merges partial stored data with defaults", () => {
    window.localStorage.setItem(
      "pr-flow:notification-preferences",
      JSON.stringify({ alerts: { prApproved: false } })
    );

    const loaded = loadNotificationPreferences();
    expect(loaded.alerts.prApproved).toBe(false);
    expect(loaded.alerts.prStatusChanged).toBe(true);
    expect(loaded.staleDaysThreshold).toBe(3);
  });
});
