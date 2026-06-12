import { afterEach, describe, expect, it, vi } from "vitest";
import { SlackConfigError } from "@/modules/slack/lib/slack-config";
import { SlackApiError } from "@/modules/slack/lib/slack-client";
import { SlackPrShareError } from "@/modules/slack/lib/slack-pr-share-service";
import * as slackPrShareService from "@/modules/slack/lib/slack-pr-share-service";
import * as prSlackShareRepository from "@/modules/prs/lib/pr-slack-share-repository";
import { POST } from "@/app/api/prs/slack-share/route";

describe("POST /api/prs/slack-share", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns 400 for invalid body", async () => {
    const response = await POST(
      new Request("http://localhost/api/prs/slack-share", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: "", url: "not-a-url" })
      })
    );

    expect(response.status).toBe(400);
  });

  it("returns 503 when Slack is not configured", async () => {
    vi.spyOn(slackPrShareService, "sharePrToSlackChannel").mockRejectedValue(
      new SlackConfigError("Configure SLACK_BOT_OAUTH_TOKEN no .env para enviar mensagens ao Slack.")
    );

    const response = await POST(
      new Request("http://localhost/api/prs/slack-share", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: "JOR-1 Test",
          url: "https://github.com/acme/a/pull/1"
        })
      })
    );

    expect(response.status).toBe(503);
  });

  it("returns 400 when PR has no Jira key", async () => {
    vi.spyOn(slackPrShareService, "sharePrToSlackChannel").mockRejectedValue(
      new SlackPrShareError("A PR precisa de uma chave Jira (JOR-xxx) no título para enviar ao Slack.")
    );

    const response = await POST(
      new Request("http://localhost/api/prs/slack-share", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: "Sem Jira",
          url: "https://github.com/acme/a/pull/1"
        })
      })
    );

    expect(response.status).toBe(400);
  });

  it("returns 502 on Slack API errors", async () => {
    vi.spyOn(slackPrShareService, "sharePrToSlackChannel").mockRejectedValue(
      new SlackApiError("O bot não tem acesso ao canal do Slack. Convide o bot para o canal squad-jornada-pr.")
    );

    const response = await POST(
      new Request("http://localhost/api/prs/slack-share", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: "JOR-1 Test",
          url: "https://github.com/acme/a/pull/1"
        })
      })
    );

    expect(response.status).toBe(502);
  });

  it("returns 200 when share succeeds", async () => {
    vi.spyOn(slackPrShareService, "sharePrToSlackChannel").mockResolvedValue({
      channel: "squad-jornada-pr",
      threadTs: "1234.5678"
    });
    const recordPrSlackShare = vi.spyOn(prSlackShareRepository, "recordPrSlackShare").mockResolvedValue({
      sharedAt: "2026-05-28T12:00:00.000Z",
      channel: "squad-jornada-pr"
    });

    const response = await POST(
      new Request("http://localhost/api/prs/slack-share", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: "JOR-1 Test",
          url: "https://github.com/acme/a/pull/1",
          prId: "PR_1",
          selectedPrUrls: [
            "https://github.com/acme/a/pull/1",
            "https://github.com/acme/b/pull/2"
          ],
          prRecords: [
            { url: "https://github.com/acme/a/pull/1", prId: "PR_1" },
            { url: "https://github.com/acme/b/pull/2", prId: "PR_2" }
          ]
        })
      })
    );

    const body = (await response.json()) as {
      ok: boolean;
      threadTs: string;
      slackShare: { sharedAt: string; channel: string };
      slackShares: Record<string, { sharedAt: string; channel: string }>;
    };
    expect(response.status).toBe(200);
    expect(body.ok).toBe(true);
    expect(body.threadTs).toBe("1234.5678");
    expect(body.slackShare.channel).toBe("squad-jornada-pr");
    expect(slackPrShareService.sharePrToSlackChannel).toHaveBeenCalledWith({
      title: "JOR-1 Test",
      selectedPrUrls: [
        "https://github.com/acme/a/pull/1",
        "https://github.com/acme/b/pull/2"
      ]
    });
    expect(recordPrSlackShare).toHaveBeenCalledTimes(2);
    expect(recordPrSlackShare).toHaveBeenCalledWith({
      prUrl: "https://github.com/acme/a/pull/1",
      prId: "PR_1",
      channel: "squad-jornada-pr",
      threadTs: "1234.5678"
    });
    expect(recordPrSlackShare).toHaveBeenCalledWith({
      prUrl: "https://github.com/acme/b/pull/2",
      prId: "PR_2",
      channel: "squad-jornada-pr",
      threadTs: "1234.5678"
    });
    expect(body.slackShares["https://github.com/acme/a/pull/1"].channel).toBe("squad-jornada-pr");
  });
});
