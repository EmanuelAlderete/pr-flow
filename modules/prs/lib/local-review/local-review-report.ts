import { z } from "zod";
import { LOCAL_REVIEW_CONFIDENCE_THRESHOLD } from "@/modules/prs/lib/local-review/local-review-protocol";

const findingSchema = z.object({
  agent: z.string().min(1),
  path: z.string().min(1),
  line: z.number().int().positive().optional(),
  message: z.string().min(1),
  confidence: z.number().min(0).max(1)
});

export const localReviewReportSchema = z.object({
  summary: z.string().min(1),
  docsLoaded: z.array(z.string().min(1)).min(1),
  findings: z.array(findingSchema),
  notCommented: z.array(z.string().min(1)).min(1),
  cleanJustification: z.string().min(1),
  traceability: z
    .array(
      z.object({
        item: z.string().min(1),
        status: z.enum(["met", "unmet", "unclear"])
      })
    )
    .min(1),
  metaReview: z.object({
    dropped: z.array(z.string()),
    notes: z.string()
  })
});

export type LocalReviewReport = z.infer<typeof localReviewReportSchema>;

export function extractReviewJson(raw: string): unknown {
  const trimmed = stripFence(raw.trim());
  const parsed = parseJsonObject(trimmed);
  if (isClaudeWrapper(parsed)) {
    return extractReviewJson(parsed.result);
  }
  return parsed;
}

export function parseLocalReviewReport(raw: string): LocalReviewReport {
  const json = extractReviewJson(raw);
  return localReviewReportSchema.parse(json);
}

export function applyReviewPolicy(report: LocalReviewReport): LocalReviewReport {
  const dropped = new Set(report.metaReview.dropped.map((item) => item.trim()).filter(Boolean));
  const findings = report.findings.filter(
    (finding) =>
      finding.confidence >= LOCAL_REVIEW_CONFIDENCE_THRESHOLD && !dropped.has(finding.message.trim())
  );

  return { ...report, findings };
}

function stripFence(text: string): string {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  return fenced?.[1]?.trim() ?? text;
}

function parseJsonObject(text: string): unknown {
  try {
    return JSON.parse(text) as unknown;
  } catch {
    const start = text.indexOf("{");
    const end = text.lastIndexOf("}");
    if (start === -1 || end <= start) {
      throw new Error("A revisão não devolveu JSON.");
    }
    return JSON.parse(text.slice(start, end + 1)) as unknown;
  }
}

function isClaudeWrapper(value: unknown): value is { result: string } {
  if (!value || typeof value !== "object") {
    return false;
  }
  const result = (value as { result?: unknown }).result;
  return typeof result === "string" && !("summary" in value);
}
