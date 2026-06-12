import { beforeEach, describe, expect, it, vi } from "vitest";

const selectMock = vi.fn();

vi.mock("@/modules/db/lib/db", () => ({
  getDb: () => ({
    select: selectMock
  })
}));

describe("listActiveNotesMentioningIssueKey", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("retorna apenas notas ativas que mencionam a chave", async () => {
    const where = vi.fn().mockResolvedValue([
      {
        id: "n1",
        notebookDay: "2026-05-28",
        body: "Pair no JOR-123",
        createdAt: new Date("2026-05-28T12:00:00Z"),
        updatedAt: new Date("2026-05-28T12:00:00Z"),
        deletedAt: null
      },
      {
        id: "n2",
        notebookDay: "2026-05-27",
        body: "Sem ticket",
        createdAt: new Date("2026-05-27T12:00:00Z"),
        updatedAt: new Date("2026-05-27T12:00:00Z"),
        deletedAt: null
      }
    ]);
    const from = vi.fn().mockReturnValue({ where });
    selectMock.mockReturnValue({ from });

    const { listActiveNotesMentioningIssueKey } = await import(
      "@/modules/journal/lib/note-repository"
    );
    const notes = await listActiveNotesMentioningIssueKey("JOR-123");

    expect(notes).toHaveLength(1);
    expect(notes[0]?.id).toBe("n1");
  });
});
