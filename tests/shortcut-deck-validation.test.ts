import { describe, expect, it } from "vitest";
import {
  isExternalShortcutUrl,
  isValidShortcutUrl,
  shortcutDeckStoredSchema,
  shortcutSchema
} from "@/modules/shortcut-deck/lib/shortcut-deck-validation";

describe("shortcut URL validation", () => {
  it("accepts https URLs and internal paths", () => {
    expect(isValidShortcutUrl("https://slack.com")).toBe(true);
    expect(isValidShortcutUrl("http://localhost:3000")).toBe(true);
    expect(isValidShortcutUrl("/devtools/local-docker")).toBe(true);
    expect(isValidShortcutUrl("/")).toBe(true);
  });

  it("rejects javascript and protocol-relative URLs", () => {
    expect(isValidShortcutUrl("javascript:alert(1)")).toBe(false);
    expect(isValidShortcutUrl("//evil.example")).toBe(false);
    expect(isValidShortcutUrl("ftp://files.example")).toBe(false);
  });

  it("detects external URLs", () => {
    expect(isExternalShortcutUrl("https://argo.example")).toBe(true);
    expect(isExternalShortcutUrl("/prs")).toBe(false);
  });
});

describe("shortcutDeckStoredSchema", () => {
  it("parses a valid deck", () => {
    const parsed = shortcutDeckStoredSchema.safeParse({
      shortcuts: [
        {
          id: "1",
          label: "Slack",
          url: "https://app.slack.com",
          iconId: "slack",
          colorId: "sky",
          sortOrder: 0
        }
      ]
    });
    expect(parsed.success).toBe(true);
  });

  it("rejects unknown icons", () => {
    const parsed = shortcutSchema.safeParse({
      id: "1",
      label: "X",
      url: "https://example.com",
      iconId: "not-an-icon",
      colorId: "ember",
      sortOrder: 0
    });
    expect(parsed.success).toBe(false);
  });
});
