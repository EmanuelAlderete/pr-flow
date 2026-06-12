import { describe, expect, it, vi, beforeEach } from "vitest";
import { GET as getBriefing } from "@/app/api/dashboard/briefing/route";

const getDashboardBriefing = vi.fn();

vi.mock("@/modules/dashboard/lib/dashboard-briefing-service", () => ({
  getDashboardBriefing: (...args: unknown[]) => getDashboardBriefing(...args)
}));

describe("/api/dashboard/daily-summary (legado)", () => {
  beforeEach(() => {
    getDashboardBriefing.mockReset();
  });

  it("delega GET ao mesmo comportamento de /api/dashboard/briefing", async () => {
    getDashboardBriefing.mockResolvedValue({
      status: "ok",
      day: "2026-06-01",
      previousBusinessDay: "2026-05-29",
      summary: "## Briefing",
      generatedAt: "2026-06-01T10:00:00.000Z"
    });

    const { GET } = await import("@/app/api/dashboard/daily-summary/route");
    const legacyRequest = new Request(
      "http://localhost/api/dashboard/daily-summary?day=2026-06-01"
    );
    const briefingRequest = new Request(
      "http://localhost/api/dashboard/briefing?day=2026-06-01"
    );

    const legacyResponse = await GET(legacyRequest);
    const briefingResponse = await getBriefing(briefingRequest);

    expect(legacyResponse.status).toBe(briefingResponse.status);
    expect(await legacyResponse.json()).toEqual(await briefingResponse.json());
    expect(getDashboardBriefing).toHaveBeenCalledWith("2026-06-01");
  });
});
