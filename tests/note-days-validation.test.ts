import { describe, expect, it } from "vitest";
import { validateNoteDaysRangeQuery } from "@/modules/journal/lib/note-days-validation";

describe("validateNoteDaysRangeQuery", () => {
  it("accepts an inclusive valid range", () => {
    expect(validateNoteDaysRangeQuery("2026-08-01", "2026-08-31")).toEqual({
      ok: true,
      value: { from: "2026-08-01", to: "2026-08-31" }
    });
  });

  it("rejects inverted ranges", () => {
    const result = validateNoteDaysRangeQuery("2026-08-31", "2026-08-01");
    expect(result.ok).toBe(false);
  });

  it("rejects missing bounds", () => {
    const result = validateNoteDaysRangeQuery(null, "2026-08-01");
    expect(result.ok).toBe(false);
  });
});
