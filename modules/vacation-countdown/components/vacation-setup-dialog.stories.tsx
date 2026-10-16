import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import {
  clearVacationCountdown,
  saveVacationCountdown,
  VACATION_COUNTDOWN_STORAGE_KEY,
  VACATION_COUNTDOWN_UPDATED_EVENT
} from "@/modules/vacation-countdown/lib/vacation-countdown-storage";
import type { VacationCountdownStored } from "@/modules/vacation-countdown/lib/vacation-countdown-validation";

import { VacationCountdownBootstrap, VacationSetupDialog } from "./vacation-setup-dialog";

function localIsoDate(offsetDays: number): string {
  const date = new Date();
  date.setHours(12, 0, 0, 0);
  date.setDate(date.getDate() + offsetDays);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function withVacation(settings: VacationCountdownStored | null): () => void {
  const previous = window.localStorage.getItem(VACATION_COUNTDOWN_STORAGE_KEY);
  if (settings === null) {
    clearVacationCountdown();
  } else {
    saveVacationCountdown(settings);
  }

  return () => {
    if (previous === null) {
      window.localStorage.removeItem(VACATION_COUNTDOWN_STORAGE_KEY);
    } else {
      window.localStorage.setItem(VACATION_COUNTDOWN_STORAGE_KEY, previous);
    }
    window.dispatchEvent(new Event(VACATION_COUNTDOWN_UPDATED_EVENT));
  };
}

const meta = {
  title: "Dashboard/VacationSetupDialog",
  component: VacationSetupDialog,
  args: {
    open: true,
    mode: "setup",
    onOpenChange: () => undefined
  },
  beforeEach: () => withVacation(null)
} satisfies Meta<typeof VacationSetupDialog>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Edit: Story = {
  args: {
    mode: "edit",
    initialDate: localIsoDate(12)
  }
};

export const FirstVisit: Story = {
  render: () => <VacationCountdownBootstrap />
};
