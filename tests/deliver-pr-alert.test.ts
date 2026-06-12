import { afterEach, describe, expect, it, vi } from "vitest";
import type { PrAlertEvent } from "@/modules/notifications/lib/pr-alert-events";
import {
  clearRecentAlertIds,
  deliverPrAlert,
  shouldDeliverBrowserNotification
} from "@/modules/notifications/lib/deliver-pr-alert";

const sampleEvent: PrAlertEvent = {
  id: "PR_1:approved",
  type: "prApproved",
  title: "PR #1: Aprovada",
  body: "Revisão pendente → Aprovada"
};

describe("deliverPrAlert", () => {
  afterEach(() => {
    clearRecentAlertIds();
  });

  it("uses browser notification when permission is granted and tab is hidden", () => {
    const notify = vi.fn();
    const toast = vi.fn();

    deliverPrAlert(sampleEvent, {
      permission: "granted",
      documentVisible: false,
      notify,
      toast
    });

    expect(notify).toHaveBeenCalledWith("PR #1: Aprovada", "Revisão pendente → Aprovada");
    expect(toast).not.toHaveBeenCalled();
  });

  it("falls back to toast when notification permission is denied", () => {
    const notify = vi.fn();
    const toast = vi.fn();

    deliverPrAlert(sampleEvent, {
      permission: "denied",
      documentVisible: false,
      notify,
      toast
    });

    expect(notify).not.toHaveBeenCalled();
    expect(toast).toHaveBeenCalledWith("PR #1: Aprovada", "Revisão pendente → Aprovada");
  });

  it("uses toast in foreground even with granted permission", () => {
    const notify = vi.fn();
    const toast = vi.fn();

    deliverPrAlert(sampleEvent, {
      permission: "granted",
      documentVisible: true,
      notify,
      toast
    });

    expect(notify).not.toHaveBeenCalled();
    expect(toast).toHaveBeenCalledOnce();
  });

  it("debounces duplicate alerts within the cooldown window", () => {
    const toast = vi.fn();
    const options = {
      permission: "denied" as NotificationPermission,
      documentVisible: true,
      notify: vi.fn(),
      toast
    };

    deliverPrAlert(sampleEvent, options);
    deliverPrAlert(sampleEvent, options);

    expect(toast).toHaveBeenCalledOnce();
  });
});

describe("shouldDeliverBrowserNotification", () => {
  it("returns true only when permission granted and document hidden", () => {
    expect(shouldDeliverBrowserNotification("granted", false)).toBe(true);
    expect(shouldDeliverBrowserNotification("granted", true)).toBe(false);
    expect(shouldDeliverBrowserNotification("denied", false)).toBe(false);
    expect(shouldDeliverBrowserNotification("default", false)).toBe(false);
  });
});
