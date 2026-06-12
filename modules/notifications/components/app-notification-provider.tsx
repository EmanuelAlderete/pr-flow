"use client";

import { useAppNotifications } from "@/modules/notifications/hooks/use-app-notifications";
import { usePrNotificationSync } from "@/modules/notifications/hooks/use-pr-notification-sync";

export function AppNotificationProvider() {
  const { deliverAlert } = useAppNotifications();
  usePrNotificationSync(deliverAlert);
  return null;
}
