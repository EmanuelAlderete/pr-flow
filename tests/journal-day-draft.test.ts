import { describe, expect, it } from "vitest";
import { mergeJournalDayDraft, normalizeJournalDayDraft } from "@/modules/journal/lib/journal-day-draft";
import { buildJournalDayDraftPrompt } from "@/modules/journal/lib/journal-day-draft-prompt";
import type { DailySummaryContext } from "@/modules/notebook-day/lib/types";

const context: DailySummaryContext = {
  day: "2026-05-28",
  noteBody: "Já anotei o standup.",
  pendingTasks: [],
  completedTodayTasks: [{ title: "Fechar revisão do journal", description: null, dueDate: null }],
  jira: null,
  prs: null
};

describe("journal day draft", () => {
  it("asks for done work, deliveries, and questions the person can answer", () => {
    const prompt = buildJournalDayDraftPrompt(context);

    expect(prompt).toContain("## Feito");
    expect(prompt).toContain("## Entregue");
    expect(prompt).toContain("## Perguntas");
    expect(prompt).toContain("Fechar revisão do journal");
    expect(prompt).toContain("Já anotei o standup.");
    expect(prompt).toContain("> ");
  });

  it("strips a markdown fence around the draft", () => {
    expect(normalizeJournalDayDraft("```markdown\n## Feito\n- revisei\n```")).toBe(
      "## Feito\n- revisei"
    );
  });

  it("fills an empty note and appends without duplicating an existing draft", () => {
    const draft = "## Feito\n- revisei\n\n## Perguntas\n- O que travou?\n> ";
    const normalized = draft.trim();

    expect(mergeJournalDayDraft("", draft)).toBe(normalized);
    expect(mergeJournalDayDraft("Standup da manhã", draft)).toBe(
      `Standup da manhã\n\n${normalized}`
    );
    expect(mergeJournalDayDraft(`Standup da manhã\n\n${normalized}`, draft)).toBe(
      `Standup da manhã\n\n${normalized}`
    );
  });
});
