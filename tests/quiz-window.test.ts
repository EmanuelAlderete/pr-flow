import { describe, expect, it } from "vitest";
import { isQuizWindowOpen, nextBusinessDay } from "@/modules/day-follow-up/lib/quiz-window";

const TIME_ZONE = "America/Sao_Paulo";
const FRIDAY = "2026-08-07";

describe("quiz window", () => {
  it("keeps Friday open through Monday and closes after that Monday", () => {
    expect(nextBusinessDay(FRIDAY)).toBe("2026-08-10");

    expect(
      isQuizWindowOpen({
        notebookDay: FRIDAY,
        now: new Date("2026-08-08T15:00:00-03:00"),
        timeZone: TIME_ZONE,
        scriptUsed: false
      })
    ).toBe(true);

    expect(
      isQuizWindowOpen({
        notebookDay: FRIDAY,
        now: new Date("2026-08-10T18:00:00-03:00"),
        timeZone: TIME_ZONE,
        scriptUsed: false
      })
    ).toBe(true);

    expect(
      isQuizWindowOpen({
        notebookDay: FRIDAY,
        now: new Date("2026-08-11T00:30:00-03:00"),
        timeZone: TIME_ZONE,
        scriptUsed: false
      })
    ).toBe(false);
  });

  it("closes when the script is marked used and stays open when it is only read", () => {
    const now = new Date("2026-08-07T15:00:00-03:00");

    expect(
      isQuizWindowOpen({
        notebookDay: FRIDAY,
        now,
        timeZone: TIME_ZONE,
        scriptUsed: false
      })
    ).toBe(true);

    expect(
      isQuizWindowOpen({
        notebookDay: FRIDAY,
        now,
        timeZone: TIME_ZONE,
        scriptUsed: true
      })
    ).toBe(false);
  });
});
