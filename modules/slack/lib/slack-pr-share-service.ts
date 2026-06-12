import { resolveSlackPrShareFromTitle } from "@/modules/prs/lib/core/pr-slack-share";
import { getSlackPrChannel } from "@/modules/slack/lib/slack-config";
import { postSlackMessage } from "@/modules/slack/lib/slack-client";

export class SlackPrShareError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SlackPrShareError";
  }
}

/** Sem preview de Jira/GitHub — só texto e links clicáveis. */
const PR_SHARE_SLACK_OPTS = { unfurlLinks: false, unfurlMedia: false } as const;

export async function sharePrToSlackChannel(input: {
  title: string;
  selectedPrUrls: string[];
}): Promise<{ channel: string; threadTs: string }> {
  const payload = resolveSlackPrShareFromTitle({
    title: input.title,
    prUrls: input.selectedPrUrls
  });
  if (!payload) {
    throw new SlackPrShareError(
      "A PR precisa de uma chave Jira (JOR-xxx) no título para enviar ao Slack."
    );
  }

  const channel = getSlackPrChannel();
  const parent = await postSlackMessage({
    channel,
    text: payload.channelText,
    ...PR_SHARE_SLACK_OPTS
  });

  if (!parent.ts) {
    throw new SlackPrShareError("Slack não retornou o identificador da mensagem.");
  }

  await postSlackMessage({
    channel,
    text: payload.threadText,
    threadTs: parent.ts,
    ...PR_SHARE_SLACK_OPTS
  });

  return { channel, threadTs: parent.ts };
}
