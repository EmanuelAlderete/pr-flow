import { beforeEach, describe, expect, it, vi } from "vitest";

const listActiveNotesMentioningIssueKey = vi.fn();

vi.mock("@/modules/journal/lib/note-repository", () => ({
  listActiveNotesMentioningIssueKey: (...args: unknown[]) => listActiveNotesMentioningIssueKey(...args)
}));

describe("loadWorkContextJournalMentions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("extrai menções das notas filtradas por chave", async () => {
    listActiveNotesMentioningIssueKey.mockResolvedValue([
      {
        id: "n1",
        notebookDay: "2026-05-28",
        body: "Pair no JOR-123",
        createdAt: "2026-05-28T12:00:00.000Z",
        updatedAt: "2026-05-28T12:00:00.000Z"
      }
    ]);

    const { loadWorkContextJournalMentions } = await import(
      "@/modules/work-context/lib/work-context-journal"
    );
    const mentions = await loadWorkContextJournalMentions("jor-123");

    expect(listActiveNotesMentioningIssueKey).toHaveBeenCalledWith("JOR-123");
    expect(mentions).toHaveLength(1);
    expect(mentions[0]?.notebookDay).toBe("2026-05-28");
    expect(mentions[0]?.excerpt).toMatch(/JOR-123/);
  });
});
