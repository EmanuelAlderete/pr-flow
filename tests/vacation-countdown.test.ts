import { afterEach, describe, expect, it } from "vitest";
import {
  clearVacationCountdown,
  loadVacationCountdown,
  needsVacationSetupPrompt,
  saveVacationCountdown,
  VACATION_COUNTDOWN_STORAGE_KEY
} from "@/modules/vacation-countdown/lib/vacation-countdown-storage";
import {
  daysUntilVacation,
  vacationCountdownPhase
} from "@/modules/vacation-countdown/lib/vacation-days-until";
import {
  formatVacationDaysLabel,
  formatVacationSidebarHeadline
} from "@/modules/vacation-countdown/lib/vacation-countdown-labels";

describe("daysUntilVacation", () => {
  it("counts calendar days until the start date", () => {
    expect(daysUntilVacation("2026-08-10", new Date(2026, 7, 1))).toBe(9);
    expect(daysUntilVacation("2026-08-10", new Date(2026, 7, 10))).toBe(0);
    expect(daysUntilVacation("2026-08-10", new Date(2026, 7, 12))).toBe(-2);
  });

  it("maps remaining days to display phases", () => {
    expect(vacationCountdownPhase(3)).toBe("upcoming");
    expect(vacationCountdownPhase(0)).toBe("today");
    expect(vacationCountdownPhase(-1)).toBe("ongoing");
  });
});

describe("vacation countdown labels", () => {
  it("formats upcoming, today and ongoing copy", () => {
    expect(formatVacationDaysLabel(5, "upcoming")).toBe("Faltam 5 dias para as férias.");
    expect(formatVacationDaysLabel(1, "upcoming")).toBe("Falta 1 dia para as férias.");
    expect(formatVacationDaysLabel(0, "today")).toBe("As férias começam hoje!");
    expect(formatVacationDaysLabel(-3, "ongoing")).toBe("Você já está de férias.");
  });

  it("formats compact sidebar headlines", () => {
    expect(formatVacationSidebarHeadline(12, "upcoming")).toBe("12");
    expect(formatVacationSidebarHeadline(0, "today")).toBe("Hoje");
    expect(formatVacationSidebarHeadline(-1, "ongoing")).toBe("Já!");
  });
});

describe("vacation countdown storage", () => {
  afterEach(() => {
    clearVacationCountdown();
  });

  it("returns empty settings when nothing is stored", () => {
    expect(loadVacationCountdown()).toEqual({ startDate: null, promptDismissed: false });
    expect(needsVacationSetupPrompt()).toBe(true);
  });

  it("persists start date and dismisses the setup prompt", () => {
    saveVacationCountdown({ startDate: "2026-12-20", promptDismissed: true });
    expect(loadVacationCountdown()).toEqual({ startDate: "2026-12-20", promptDismissed: true });
    expect(needsVacationSetupPrompt()).toBe(false);
  });

  it("rejects invalid stored payloads", () => {
    window.localStorage.setItem(VACATION_COUNTDOWN_STORAGE_KEY, JSON.stringify({ startDate: "nope" }));
    expect(loadVacationCountdown()).toEqual({ startDate: null, promptDismissed: false });
  });

  it("treats dismissed prompt without date as configured for prompt purposes", () => {
    saveVacationCountdown({ startDate: null, promptDismissed: true });
    expect(needsVacationSetupPrompt()).toBe(false);
  });
});
