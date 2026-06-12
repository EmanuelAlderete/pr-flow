import { describe, expect, it } from "vitest";
import {
  catchupDailyStartDay,
  enumerateDaysInclusive,
  lastCompletedWeekMonday,
  previousBusinessDay,
  weekDayRange,
  yesterdayLocalDay
} from "@/modules/summaries/lib/summary-period";

describe("summary-period", () => {
  it("yesterdayLocalDay retorna o dia anterior", () => {
    const yesterday = yesterdayLocalDay(new Date(2026, 4, 28, 12, 0, 0));
    expect(yesterday).toBe("2026-05-27");
  });

  it("weekDayRange cobre segunda a domingo", () => {
    expect(weekDayRange("2026-05-18")).toEqual([
      "2026-05-18",
      "2026-05-19",
      "2026-05-20",
      "2026-05-21",
      "2026-05-22",
      "2026-05-23",
      "2026-05-24"
    ]);
  });

  it("lastCompletedWeekMonday na segunda aponta para a semana que terminou ontem", () => {
    expect(lastCompletedWeekMonday("2026-05-25")).toBe("2026-05-18");
  });

  it("enumerateDaysInclusive inclui ambos os extremos", () => {
    expect(enumerateDaysInclusive("2026-05-20", "2026-05-22")).toEqual([
      "2026-05-20",
      "2026-05-21",
      "2026-05-22"
    ]);
  });

  it("catchupDailyStartDay limita janela sem histórico", () => {
    const start = catchupDailyStartDay(null, "2026-05-28");
    expect(start).toBe("2026-05-15");
  });

  it("catchupDailyStartDay continua após último resumo", () => {
    const start = catchupDailyStartDay("2026-05-25", "2026-05-28");
    expect(start).toBe("2026-05-26");
  });

  it("previousBusinessDay na segunda retorna sexta anterior", () => {
    expect(previousBusinessDay("2026-06-01")).toBe("2026-05-29");
  });

  it("previousBusinessDay em dia útil retorna o dia anterior", () => {
    expect(previousBusinessDay("2026-05-28")).toBe("2026-05-27");
  });

  it("previousBusinessDay no sábado retorna sexta", () => {
    expect(previousBusinessDay("2026-05-30")).toBe("2026-05-29");
  });
});
