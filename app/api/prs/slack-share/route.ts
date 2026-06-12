import { NextResponse } from "next/server";
import { sanitizeErrorForLog } from "@/modules/observability/lib/log-sanitize";
import { writeSystemLogFireAndForget } from "@/modules/observability/lib/system-logger";
import { recordPrSlackShare } from "@/modules/prs/lib/pr-slack-share-repository";
import { prSlackShareBodySchema } from "@/modules/prs/lib/pr-slack-share-validation";
import { SlackConfigError } from "@/modules/slack/lib/slack-config";
import { SlackApiError } from "@/modules/slack/lib/slack-client";
import {
  sharePrToSlackChannel,
  SlackPrShareError
} from "@/modules/slack/lib/slack-pr-share-service";

const API_PRS_SLACK_SHARE_LOG_SOURCE = "api:prs-slack-share";

function logSlackShareFailure(
  level: "warn" | "error",
  message: string,
  details: Record<string, unknown>
): void {
  writeSystemLogFireAndForget({
    level,
    source: API_PRS_SLACK_SHARE_LOG_SOURCE,
    message,
    details
  });
}

export async function POST(request: Request) {
  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: "Corpo da requisição inválido." }, { status: 400 });
  }

  const parsed = prSlackShareBodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Dados inválidos.", issues: parsed.error.flatten() },
      { status: 400 }
    );
  }

  try {
    const result = await sharePrToSlackChannel({
      title: parsed.data.title,
      selectedPrUrls: parsed.data.selectedPrUrls
    });

    const slackShares: Record<string, Awaited<ReturnType<typeof recordPrSlackShare>>> = {};
    for (const record of parsed.data.prRecords) {
      slackShares[record.url] = await recordPrSlackShare({
        prUrl: record.url,
        prId: record.prId,
        channel: result.channel,
        threadTs: result.threadTs
      });
    }

    const slackShare = slackShares[parsed.data.url] ?? Object.values(slackShares)[0];

    return NextResponse.json({ ok: true, ...result, slackShare, slackShares });
  } catch (error) {
    const baseDetails = {
      title: parsed.data.title,
      url: parsed.data.url
    };

    if (error instanceof SlackConfigError) {
      logSlackShareFailure("warn", error.message, { ...baseDetails, code: "slack_config" });
      return NextResponse.json({ error: error.message }, { status: 503 });
    }
    if (error instanceof SlackPrShareError) {
      logSlackShareFailure("warn", error.message, { ...baseDetails, code: "slack_pr_share" });
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    if (error instanceof SlackApiError) {
      logSlackShareFailure("error", error.message, { ...baseDetails, code: "slack_api" });
      return NextResponse.json({ error: error.message }, { status: 502 });
    }

    logSlackShareFailure("error", "Não foi possível enviar a PR para o Slack.", {
      ...baseDetails,
      code: "unknown",
      error: sanitizeErrorForLog(error)
    });
    return NextResponse.json(
      { error: "Não foi possível enviar a PR para o Slack." },
      { status: 500 }
    );
  }
}
