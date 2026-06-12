import { afterEach, describe, expect, it, vi } from "vitest";
import {
  buildSlackPrChannelText,
  buildSlackPrThreadText,
  resolveSlackPrShare,
  resolveSlackPrShareFromTitle
} from "@/modules/prs/lib/core/pr-slack-share";
import * as slackClient from "@/modules/slack/lib/slack-client";
import { sharePrToSlackChannel } from "@/modules/slack/lib/slack-pr-share-service";

describe("pr-slack-share messages", () => {
  it("monta texto do canal com titulo e link do Jira", () => {
    expect(buildSlackPrChannelText("JOR-99 - Ajuste", "JOR-99")).toBe(
      "JOR-99 - Ajuste - https://jusfy.atlassian.net/browse/JOR-99"
    );
  });

  it("monta resposta na thread com links das PRs em lista", () => {
    expect(buildSlackPrThreadText(["https://github.com/acme/a/pull/7"])).toBe(
      "- https://github.com/acme/a/pull/7"
    );
    expect(
      buildSlackPrThreadText([
        "https://github.com/acme/a/pull/7",
        "https://github.com/acme/b/pull/3"
      ])
    ).toBe("- https://github.com/acme/a/pull/7\n- https://github.com/acme/b/pull/3");
  });

  it("retorna null quando nao ha chave Jira no titulo", () => {
    expect(
      resolveSlackPrShareFromTitle({ title: "fix retries", prUrls: ["https://github.com/acme/a/pull/1"] })
    ).toBeNull();
  });

  it("resolve payload com chave Jira e urls selecionadas", () => {
    expect(
      resolveSlackPrShare({
        issueKey: "JOR-42",
        channelLabel: "JOR-42 - Feature",
        prUrls: ["https://github.com/acme/a/pull/7"]
      })
    ).toEqual({
      issueKey: "JOR-42",
      channelText: "JOR-42 - Feature - https://jusfy.atlassian.net/browse/JOR-42",
      threadText: "- https://github.com/acme/a/pull/7"
    });
  });
});

describe("sharePrToSlackChannel", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("envia mensagem no canal e resposta na thread", async () => {
    const postSlackMessage = vi
      .spyOn(slackClient, "postSlackMessage")
      .mockResolvedValueOnce({ ok: true, ts: "1234.5678" })
      .mockResolvedValueOnce({ ok: true });

    const result = await sharePrToSlackChannel({
      title: "JOR-42 Feature",
      selectedPrUrls: ["https://github.com/acme/a/pull/7"]
    });

    expect(result.threadTs).toBe("1234.5678");
    expect(postSlackMessage).toHaveBeenCalledTimes(2);
    expect(postSlackMessage.mock.calls[0]?.[0]).toMatchObject({
      channel: "squad-jornada-pr",
      text: "JOR-42 - Feature - https://jusfy.atlassian.net/browse/JOR-42",
      unfurlLinks: false,
      unfurlMedia: false
    });
    expect(postSlackMessage.mock.calls[1]?.[0]).toMatchObject({
      channel: "squad-jornada-pr",
      text: "- https://github.com/acme/a/pull/7",
      threadTs: "1234.5678",
      unfurlLinks: false,
      unfurlMedia: false
    });
  });

  it("envia varias PRs na mesma thread", async () => {
    const postSlackMessage = vi
      .spyOn(slackClient, "postSlackMessage")
      .mockResolvedValueOnce({ ok: true, ts: "1234.5678" })
      .mockResolvedValueOnce({ ok: true });

    await sharePrToSlackChannel({
      title: "JOR-42 Feature",
      selectedPrUrls: [
        "https://github.com/acme/a/pull/7",
        "https://github.com/acme/b/pull/3"
      ]
    });

    expect(postSlackMessage.mock.calls[1]?.[0]).toMatchObject({
      text: "- https://github.com/acme/a/pull/7\n- https://github.com/acme/b/pull/3"
    });
  });
});
