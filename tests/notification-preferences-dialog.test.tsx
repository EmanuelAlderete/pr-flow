import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { NotificationPreferencesDialog } from "@/modules/notifications/components/notification-preferences-dialog";
import {
  clearNotificationPreferences,
  loadNotificationPreferences
} from "@/modules/notifications/lib/notification-preferences";

vi.mock("@/modules/notifications/hooks/use-app-notifications", () => ({
  useAppNotifications: () => ({
    permission: "default",
    requestPermission: vi.fn()
  })
}));

describe("NotificationPreferencesDialog", () => {
  afterEach(() => {
    clearNotificationPreferences();
  });

  it("lets the user disable alert types and persist them", () => {
    render(<NotificationPreferencesDialog open onOpenChange={vi.fn()} />);

    fireEvent.click(screen.getByRole("checkbox", { name: /PR aprovada/i }));
    fireEvent.click(screen.getByRole("button", { name: "Salvar preferências" }));

    expect(loadNotificationPreferences().alerts.prApproved).toBe(false);
  });
});
