import { and, desc, eq } from "drizzle-orm";
import { getDb } from "@/modules/db/lib/db";
import type { PrLocalReviewFinding, PrLocalReviewInfo } from "@/modules/prs/lib/domain";
import { prLocalReviews, type PrLocalReviewRow } from "@/modules/prs/lib/schema";
import { localReviewReportSchema } from "@/modules/prs/lib/local-review/local-review-report";

export async function listLocalReviews(): Promise<PrLocalReviewRow[]> {
  const db = getDb();
  return db.select().from(prLocalReviews).orderBy(desc(prLocalReviews.updatedAt));
}

export async function claimLocalReview(input: {
  repository: string;
  prNumber: number;
  prId: string;
  headSha: string;
  baseRef: string;
  model: string;
  now: Date;
}): Promise<void> {
  const db = getDb();
  await db
    .insert(prLocalReviews)
    .values({
      repository: input.repository,
      prNumber: input.prNumber,
      prId: input.prId,
      headSha: input.headSha,
      baseRef: input.baseRef,
      status: "running",
      model: input.model,
      summary: null,
      report: null,
      error: null,
      startedAt: input.now,
      finishedAt: null,
      createdAt: input.now,
      updatedAt: input.now
    })
    .onConflictDoUpdate({
      target: [prLocalReviews.repository, prLocalReviews.prNumber, prLocalReviews.headSha],
      set: {
        prId: input.prId,
        baseRef: input.baseRef,
        status: "running",
        model: input.model,
        summary: null,
        report: null,
        error: null,
        startedAt: input.now,
        finishedAt: null,
        updatedAt: input.now
      }
    });
}

export async function completeLocalReview(input: {
  repository: string;
  prNumber: number;
  headSha: string;
  summary: string;
  report: string;
  now: Date;
}): Promise<void> {
  const db = getDb();
  await db
    .update(prLocalReviews)
    .set({
      status: "ok",
      summary: input.summary,
      report: input.report,
      error: null,
      finishedAt: input.now,
      updatedAt: input.now
    })
    .where(matchReview(input.repository, input.prNumber, input.headSha));
}

export async function failLocalReview(input: {
  repository: string;
  prNumber: number;
  headSha: string;
  error: string;
  now: Date;
}): Promise<void> {
  const db = getDb();
  await db
    .update(prLocalReviews)
    .set({
      status: "error",
      error: input.error,
      finishedAt: input.now,
      updatedAt: input.now
    })
    .where(matchReview(input.repository, input.prNumber, input.headSha));
}

export async function getLatestLocalReviewsByPullRequest(): Promise<Map<string, PrLocalReviewInfo>> {
  const rows = await listLocalReviews();
  const latest = new Map<string, PrLocalReviewInfo>();

  for (const row of rows) {
    const key = `${row.repository}#${row.prNumber}`;
    if (latest.has(key)) {
      continue;
    }
    latest.set(key, toLocalReviewInfo(row));
  }

  return latest;
}

function matchReview(repository: string, prNumber: number, headSha: string) {
  return and(
    eq(prLocalReviews.repository, repository),
    eq(prLocalReviews.prNumber, prNumber),
    eq(prLocalReviews.headSha, headSha)
  );
}

function toLocalReviewInfo(row: PrLocalReviewRow): PrLocalReviewInfo {
  const status = row.status === "ok" || row.status === "running" || row.status === "error" ? row.status : "error";
  return {
    status,
    headSha: row.headSha,
    summary: row.summary,
    findings: findingsFromReport(row.report),
    finishedAt: row.finishedAt ? row.finishedAt.toISOString() : null,
    error: row.error
  };
}

function findingsFromReport(report: string | null): PrLocalReviewFinding[] {
  if (!report) {
    return [];
  }
  try {
    const parsed = localReviewReportSchema.safeParse(JSON.parse(report));
    if (!parsed.success) {
      return [];
    }
    return parsed.data.findings.map((finding) => ({
      agent: finding.agent,
      path: finding.path,
      line: finding.line,
      message: finding.message,
      confidence: finding.confidence
    }));
  } catch {
    return [];
  }
}
