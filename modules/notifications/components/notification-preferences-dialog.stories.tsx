import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fn } from "storybook/test";

import {
  DEFAULT_NOTIFICATION_PREFERENCES,
  type NotificationPreferences
} from "@/modules/notifications/lib/notification-preferences";

import { NotificationPreferencesDialog } from "./notification-preferences-dialog";

const PREFERENCES_KEY = "pr-flow:notification-preferences";

const stalePreferences: NotificationPreferences = {
  alerts: {
    ...DEFAULT_NOTIFICATION_PREFERENCES.alerts,
    prStale: true
  },
  staleDaysThreshold: 5
};

function replaceLocalStorageItem(key: string, value: string | null): () => void {
  const previous = window.localStorage.getItem(key);
  if (value === null) {
    window.localStorage.removeItem(key);
  } else {
    window.localStorage.setItem(key, value);
  }

  return () => {
    if (previous === null) {
      window.localStorage.removeItem(key);
    } else {
      window.localStorage.setItem(key, previous);
    }
  };
}

function stubNotificationPermission(permission: NotificationPermission): () => void {
  const descriptor = Object.getOwnPropertyDescriptor(globalThis, "Notification");
  Object.defineProperty(globalThis, "Notification", {
    configurable: true,
    writable: true,
    value: {
      permission,
      requestPermission: () => Promise.resolve(permission)
    }
  });

  return () => {
    if (descriptor) {
      Object.defineProperty(globalThis, "Notification", descriptor);
      return;
    }
    delete (globalThis as { Notification?: unknown }).Notification;
  };
}

const meta = {
  title: "Notifications/NotificationPreferencesDialog",
  component: NotificationPreferencesDialog,
  args: {
    open: true,
    onOpenChange: fn()
  },
  decorators: [
    (Story) => (
      <div className="min-h-80">
        <Story />
      </div>
    )
  ],
  beforeEach: () => {
    const restorePermission = stubNotificationPermission("default");
    const restorePreferences = replaceLocalStorageItem(PREFERENCES_KEY, null);
    return () => {
      restorePreferences();
      restorePermission();
    };
  }
} satisfies Meta<typeof NotificationPreferencesDialog>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Granted: Story = {
  beforeEach: () => stubNotificationPermission("granted")
};

export const Denied: Story = {
  beforeEach: () => stubNotificationPermission("denied")
};

export const StaleAlerts: Story = {
  beforeEach: () => replaceLocalStorageItem(PREFERENCES_KEY, JSON.stringify(stalePreferences))
};
