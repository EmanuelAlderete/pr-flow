import { describe, expect, it } from "vitest";
import {
  appendQuickNoteToBody,
  buildQuickNoteBlock,
  formatQuickNoteTimestamp,
  isQuickNoteOpenShortcut
} from "@/modules/journal/lib/quick-note";

describe("quick-note formatting", () => {
  const fixedDate = new Date(2026, 4, 29, 14, 30);

  it("formats timestamp in pt-BR", () => {
    expect(formatQuickNoteTimestamp(fixedDate)).toMatch(/29\/05\/2026/);
    expect(formatQuickNoteTimestamp(fixedDate)).toMatch(/14:30/);
  });

  it("builds quick note block with heading prefix", () => {
    const block = buildQuickNoteBlock("Ideia para o PR", fixedDate);
    expect(block).toMatch(/^### quick-note \(.+\):\nIdeia para o PR$/);
    expect(block).toContain(formatQuickNoteTimestamp(fixedDate));
  });

  it("appends to existing notebook body", () => {
    const body = appendQuickNoteToBody("## Standup", "Follow-up", fixedDate);
    expect(body).toBe(`## Standup\n\n${buildQuickNoteBlock("Follow-up", fixedDate)}`);
  });

  it("creates body when notebook is empty", () => {
    expect(appendQuickNoteToBody("   ", "Primeira nota", fixedDate)).toBe(
      buildQuickNoteBlock("Primeira nota", fixedDate)
    );
  });
});

describe("isQuickNoteOpenShortcut", () => {
  it("matches Ctrl+Space", () => {
    expect(
      isQuickNoteOpenShortcut({
        key: " ",
        code: "Space",
        ctrlKey: true,
        metaKey: false,
        altKey: false,
        shiftKey: false
      })
    ).toBe(true);
  });

  it("ignores other shortcuts", () => {
    expect(
      isQuickNoteOpenShortcut({
        key: " ",
        code: "Space",
        ctrlKey: false,
        metaKey: false,
        altKey: false,
        shiftKey: false
      })
    ).toBe(false);
    expect(
      isQuickNoteOpenShortcut({
        key: "Enter",
        code: "Enter",
        ctrlKey: true,
        metaKey: false,
        altKey: false,
        shiftKey: false
      })
    ).toBe(false);
  });
});
