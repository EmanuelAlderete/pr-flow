import { describe, expect, it, vi } from "vitest";
import { getOpenPrAndJiraAriaLabel, openPrAndJiraLinks, openUrlInNewTab } from "@/modules/prs/lib/core/open-pr-and-jira";

describe("open-pr-and-jira", () => {
  it("abre PR e Jira quando houver chave", () => {
    const openUrl = vi.fn();

    openPrAndJiraLinks(
      {
        prUrl: "https://github.com/acme/a/pull/7",
        jiraIssueKey: "JOR-1234"
      },
      openUrl
    );

    expect(openUrl).toHaveBeenCalledTimes(2);
    expect(openUrl).toHaveBeenNthCalledWith(1, "https://github.com/acme/a/pull/7");
    expect(openUrl).toHaveBeenNthCalledWith(2, "https://jusfy.atlassian.net/browse/JOR-1234");
  });

  it("abre apenas a PR quando nao houver ticket Jira", () => {
    const openUrl = vi.fn();

    openPrAndJiraLinks(
      {
        prUrl: "https://github.com/acme/a/pull/7",
        jiraIssueKey: null
      },
      openUrl
    );

    expect(openUrl).toHaveBeenCalledTimes(1);
    expect(openUrl).toHaveBeenCalledWith("https://github.com/acme/a/pull/7");
  });

  it("usa window.open com target unico para cada url", () => {
    const open = vi.fn().mockReturnValue({ blur: vi.fn(), opener: window });
    vi.stubGlobal("open", open);

    openUrlInNewTab("https://github.com/acme/a/pull/1");
    openUrlInNewTab("https://jusfy.atlassian.net/browse/JOR-1");

    expect(open).toHaveBeenCalledTimes(2);
    expect(open.mock.calls[0]?.[0]).toBe("https://github.com/acme/a/pull/1");
    expect(open.mock.calls[1]?.[0]).toBe("https://jusfy.atlassian.net/browse/JOR-1");
    expect(open.mock.calls[0]?.[1]).not.toBe(open.mock.calls[1]?.[1]);

    vi.unstubAllGlobals();
  });

  it("tenta manter foco na aba atual apos abrir nova guia", () => {
    const blur = vi.fn();
    const focus = vi.fn();
    const tab = { blur, opener: window };
    const open = vi.fn().mockReturnValue(tab);
    const windowFocus = vi.spyOn(window, "focus").mockImplementation(focus);

    vi.stubGlobal("open", open);

    openUrlInNewTab("https://github.com/acme/a/pull/1");

    expect(blur).toHaveBeenCalledTimes(1);
    expect(focus).toHaveBeenCalledTimes(1);
    expect(tab.opener).toBeNull();

    windowFocus.mockRestore();
    vi.unstubAllGlobals();
  });

  it("monta aria-label conforme presenca do ticket", () => {
    expect(getOpenPrAndJiraAriaLabel("JOR-99")).toBe("Abrir PR no GitHub e JOR-99 no Jira");
    expect(getOpenPrAndJiraAriaLabel(null)).toBe("Abrir PR no GitHub");
  });
});
