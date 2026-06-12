import { inArray } from "drizzle-orm";
import type { PrSlackShareInfo } from "@/modules/prs/lib/domain";
import { prSlackShares } from "@/modules/prs/lib/schema";
import { getDb } from "@/modules/db/lib/db";

export async function recordPrSlackShare(input: {
  prUrl: string;
  prId?: string | null;
  channel: string;
  threadTs: string;
}): Promise<PrSlackShareInfo> {
  const db = getDb();
  const [row] = await db
    .insert(prSlackShares)
    .values({
      prUrl: input.prUrl,
      prId: input.prId ?? null,
      channel: input.channel,
      threadTs: input.threadTs
    })
    .onConflictDoUpdate({
      target: prSlackShares.prUrl,
      set: {
        prId: input.prId ?? null,
        channel: input.channel,
        threadTs: input.threadTs,
        sharedAt: new Date()
      }
    })
    .returning({
      sharedAt: prSlackShares.sharedAt,
      channel: prSlackShares.channel
    });

  if (!row) {
    throw new Error("Não foi possível registrar o envio ao Slack.");
  }

  return {
    sharedAt: row.sharedAt.toISOString(),
    channel: row.channel
  };
}

export async function getPrSlackSharesByUrls(urls: string[]): Promise<Map<string, PrSlackShareInfo>> {
  const uniqueUrls = [...new Set(urls.filter(Boolean))];
  if (uniqueUrls.length === 0) {
    return new Map();
  }

  const db = getDb();
  const rows = await db
    .select({
      prUrl: prSlackShares.prUrl,
      sharedAt: prSlackShares.sharedAt,
      channel: prSlackShares.channel
    })
    .from(prSlackShares)
    .where(inArray(prSlackShares.prUrl, uniqueUrls));

  return new Map(
    rows.map((row) => [
      row.prUrl,
      {
        sharedAt: row.sharedAt.toISOString(),
        channel: row.channel
      }
    ])
  );
}
