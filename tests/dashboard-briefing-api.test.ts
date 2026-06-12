import { describe, expect, it, vi, beforeEach } from "vitest";
import { GET } from "@/app/api/dashboard/briefing/route";

const getDashboardBriefing = vi.fn();

vi.mock("@/modules/dashboard/lib/dashboard-briefing-service", () => ({
  getDashboardBriefing: (...args: unknown[]) => getDashboardBriefing(...args)
}));

describe("/api/dashboard/briefing", () => {
  beforeEach(() => {
    getDashboardBriefing.mockReset();
  });

  describe("GET", () => {
    it("retorna briefing persistido", async () => {
      getDashboardBriefing.mockResolvedValue({
        status: "ok",
        day: "2026-06-01",
        previousBusinessDay: "2026-05-29",
        summary: "## Ontem por ticket",
        generatedAt: "2026-06-01T10:00:00.000Z"
      });

      const response = await GET(
        new Request("http://localhost/api/dashboard/briefing?day=2026-06-01")
      );
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.status).toBe("ok");
      expect(getDashboardBriefing).toHaveBeenCalledWith("2026-06-01");
    });

    it("retorna not_generated quando ainda não há briefing", async () => {
      getDashboardBriefing.mockResolvedValue({
        status: "not_generated",
        day: "2026-06-01",
        previousBusinessDay: "2026-05-29"
      });

      const response = await GET(new Request("http://localhost/api/dashboard/briefing"));
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.status).toBe("not_generated");
    });
  });
});
