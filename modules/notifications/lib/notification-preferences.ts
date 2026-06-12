export type NotificationAlertType =
  | "prStatusChanged"
  | "reviewerQueueNew"
  | "prApproved"
  | "prChangesRequested"
  | "prStale";

export type NotificationPreferences = {
  alerts: Record<NotificationAlertType, boolean>;
  staleDaysThreshold: number;
};

const STORAGE_KEY = "pr-flow:notification-preferences";

export const DEFAULT_NOTIFICATION_PREFERENCES: NotificationPreferences = {
  alerts: {
    prStatusChanged: true,
    reviewerQueueNew: true,
    prApproved: true,
    prChangesRequested: true,
    prStale: false
  },
  staleDaysThreshold: 3
};

function isNotificationAlertType(value: string): value is NotificationAlertType {
  return (
    value === "prStatusChanged" ||
    value === "reviewerQueueNew" ||
    value === "prApproved" ||
    value === "prChangesRequested" ||
    value === "prStale"
  );
}

function mergeWithDefaults(partial: unknown): NotificationPreferences {
  const base = DEFAULT_NOTIFICATION_PREFERENCES;
  if (!partial || typeof partial !== "object") {
    return base;
  }

  const candidate = partial as Partial<NotificationPreferences>;
  const alerts = { ...base.alerts };

  if (candidate.alerts && typeof candidate.alerts === "object") {
    for (const [key, value] of Object.entries(candidate.alerts)) {
      if (isNotificationAlertType(key) && typeof value === "boolean") {
        alerts[key] = value;
      }
    }
  }

  const staleDaysThreshold =
    typeof candidate.staleDaysThreshold === "number" && candidate.staleDaysThreshold > 0
      ? candidate.staleDaysThreshold
      : base.staleDaysThreshold;

  return { alerts, staleDaysThreshold };
}

export function loadNotificationPreferences(): NotificationPreferences {
  if (typeof window === "undefined") {
    return DEFAULT_NOTIFICATION_PREFERENCES;
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return DEFAULT_NOTIFICATION_PREFERENCES;
    }

    return mergeWithDefaults(JSON.parse(raw) as unknown);
  } catch {
    return DEFAULT_NOTIFICATION_PREFERENCES;
  }
}

export function saveNotificationPreferences(preferences: NotificationPreferences): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
    window.dispatchEvent(new Event("pr-flow:notification-preferences-updated"));
  } catch {
    // Ignore quota or privacy mode errors.
  }
}

export function clearNotificationPreferences(): void {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(STORAGE_KEY);
}

export function isAlertTypeEnabled(
  preferences: NotificationPreferences,
  alertType: NotificationAlertType
): boolean {
  return preferences.alerts[alertType];
}
