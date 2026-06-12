import { afterEach, describe, expect, it, vi } from "vitest";
import { fetchJiraSprints } from "@/modules/jira/lib/jira-sprint-service";

describe("fetchJiraSprints", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it("loads sprints from the scrum board of the configured project", async () => {
    vi.stubEnv("JIRA_EMAIL", "dev@example.com");
    vi.stubEnv("JIRA_TOKEN", "secret-token");
    vi.stubEnv("JIRA_SPRINT_BOARD_ID", "1032");

    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 1032, name: "Downstream scrum", type: "scrum" })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          values: [
            {
              id: 4943,
              name: "Sprint 6",
              state: "active",
              startDate: "2026-05-13T13:41:41.000Z",
              endDate: "2026-05-29T03:00:00.000Z"
            },
            {
              id: 5111,
              name: "Sprint 7",
              state: "future"
            }
          ]
        })
      });

    vi.stubGlobal("fetch", fetchMock);

    const result = await fetchJiraSprints();

    expect(result.boardId).toBe(1032);
    expect(result.boardName).toBe("Downstream scrum");
    expect(result.sprints.map((s) => s.name)).toEqual(["Sprint 6", "Sprint 7"]);
    expect(fetchMock.mock.calls[1]?.[0]).toContain("/board/1032/sprint");
  });
});
