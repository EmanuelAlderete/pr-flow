import { describe, expect, it } from "vitest";
import { shiftNotebookDay } from "@/modules/journal/lib/notebook-day";

describe("shiftNotebookDay", () => {
  it("moves to the previous and next calendar day", () => {
    expect(shiftNotebookDay("2026-05-28", -1)).toBe("2026-05-27");
    expect(shiftNotebookDay("2026-05-28", 1)).toBe("2026-05-29");
  });
});
