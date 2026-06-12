import { describe, expect, it } from "vitest";
import { extractJournalMentionsForIssueKey } from "@/modules/work-context/lib/journal-mentions";

describe("extractJournalMentionsForIssueKey", () => {
  it("retorna trechos das notas que mencionam a chave", () => {
    const mentions = extractJournalMentionsForIssueKey(
      [
        { notebookDay: "2026-05-27", body: "Sem ticket hoje." },
        {
          notebookDay: "2026-05-28",
          body: "Revisar JOR-182 com o time.\nDepois fechar JOR-182 no Jira."
        }
      ],
      "JOR-182"
    );

    expect(mentions).toHaveLength(1);
    expect(mentions[0]?.notebookDay).toBe("2026-05-28");
    expect(mentions[0]?.excerpt).toMatch(/JOR-182/);
  });

  it("ignora chaves dentro de blocos de código", () => {
    const mentions = extractJournalMentionsForIssueKey(
      [{ notebookDay: "2026-05-28", body: "```\nJOR-999\n```" }],
      "JOR-999"
    );

    expect(mentions).toHaveLength(0);
  });
});
