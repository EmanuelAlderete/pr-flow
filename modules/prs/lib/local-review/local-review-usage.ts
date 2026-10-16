import { z } from "zod";

const tokenCount = z.number().nonnegative();

const modelUsageEntrySchema = z.object({
  inputTokens: tokenCount.optional(),
  outputTokens: tokenCount.optional(),
  cacheReadInputTokens: tokenCount.optional(),
  cacheCreationInputTokens: tokenCount.optional(),
  thinkingTokens: tokenCount.optional(),
  contextWindow: z.number().int().positive().optional(),
  costUSD: z.number().optional()
});

const assistantUsageSchema = z.object({
  input_tokens: z.number().optional(),
  cache_read_input_tokens: z.number().optional(),
  cache_creation_input_tokens: z.number().optional()
});

export const localReviewModelUsageSchema = z.object({
  id: z.string().min(1),
  inputTokens: tokenCount,
  outputTokens: tokenCount,
  cacheReadInputTokens: tokenCount,
  cacheCreationInputTokens: tokenCount,
  thinkingTokens: tokenCount,
  contextWindow: z.number().int().positive().nullable(),
  costUsd: z.number().nullable()
});

export const localReviewUsageSchema = z.object({
  requestedModel: z.string().min(1).nullable(),
  models: z.array(localReviewModelUsageSchema).min(1),
  totalCostUsd: z.number().nullable(),
  peakContextTokens: tokenCount.nullable(),
  peakModel: z.string().min(1).nullable()
});

export type LocalReviewUsage = z.infer<typeof localReviewUsageSchema>;
export type LocalReviewUsageRole = "both" | "orchestrator" | "subagents";

export function presentLocalReviewUsage(usage: LocalReviewUsage): {
  chosenLabel: string | null;
  splitRoles: boolean;
  models: Array<{ id: string; role: LocalReviewUsageRole } & LocalReviewUsage["models"][number]>;
} {
  const requested = usage.requestedModel;
  const matchesRequested = (id: string) =>
    requested !== null && id.toLowerCase().includes(requested.toLowerCase());
  const splitRoles =
    requested !== null &&
    usage.models.some((model) => matchesRequested(model.id)) &&
    usage.models.some((model) => !matchesRequested(model.id));

  const models = usage.models.map((model) => ({
    ...model,
    role: (splitRoles ? (matchesRequested(model.id) ? "orchestrator" : "subagents") : "both") as LocalReviewUsageRole
  }));

  models.sort((left, right) => roleOrder(left.role) - roleOrder(right.role));

  return {
    chosenLabel: requested ? modelDisplayName(requested) : null,
    splitRoles,
    models
  };
}

export function isolateClaudeResult(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) {
    throw new Error("A revisão não devolveu JSON.");
  }

  if (tryParse(trimmed) !== undefined) {
    return trimmed;
  }

  const lines = trimmed
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  for (let index = lines.length - 1; index >= 0; index -= 1) {
    const parsed = tryParse(lines[index]);
    if (isRecord(parsed) && parsed.type === "result") {
      return lines[index];
    }
  }

  throw new Error("A revisão não devolveu JSON.");
}

export function extractLocalReviewUsage(raw: string): Omit<LocalReviewUsage, "requestedModel"> | null {
  const events = parseEvents(raw);
  const result = [...events].reverse().find((event) => event.type === "result");
  if (!result) {
    return null;
  }

  const parsedModels = z.record(z.string(), modelUsageEntrySchema).safeParse(result.modelUsage);
  if (!parsedModels.success || Object.keys(parsedModels.data).length === 0) {
    return null;
  }

  const models = Object.entries(parsedModels.data).map(([id, entry]) => ({
    id,
    inputTokens: entry.inputTokens ?? 0,
    outputTokens: entry.outputTokens ?? 0,
    cacheReadInputTokens: entry.cacheReadInputTokens ?? 0,
    cacheCreationInputTokens: entry.cacheCreationInputTokens ?? 0,
    thinkingTokens: entry.thinkingTokens ?? 0,
    contextWindow: entry.contextWindow ?? null,
    costUsd: entry.costUSD ?? null
  }));

  const peak = peakContext(events);
  const totalCost = z.number().safeParse(result.total_cost_usd);

  return localReviewUsageSchema.omit({ requestedModel: true }).parse({
    models,
    totalCostUsd: totalCost.success ? totalCost.data : sumCost(models),
    peakContextTokens: peak?.tokens ?? null,
    peakModel: peak?.model ?? null
  });
}

export function modelDisplayName(id: string): string {
  const lower = id.toLowerCase();
  if (lower.includes("haiku")) {
    return "Haiku";
  }
  if (lower.includes("sonnet")) {
    return "Sonnet";
  }
  if (lower.includes("opus")) {
    return "Opus";
  }
  return id;
}

export function formatTokenCount(value: number): string {
  return new Intl.NumberFormat("pt-BR").format(value);
}

export function formatUsd(value: number): string {
  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "USD"
  });
}

function roleOrder(role: LocalReviewUsageRole): number {
  if (role === "orchestrator") {
    return 0;
  }
  if (role === "both") {
    return 1;
  }
  return 2;
}

function peakContext(events: Array<Record<string, unknown>>): { tokens: number; model: string | null } | null {
  const seen = new Set<string>();
  let best: { tokens: number; model: string | null } | null = null;

  for (const event of events) {
    if (event.type !== "assistant" || !isRecord(event.message)) {
      continue;
    }
    const id = typeof event.message.id === "string" ? event.message.id : null;
    if (id && seen.has(id)) {
      continue;
    }
    if (id) {
      seen.add(id);
    }
    const usage = assistantUsageSchema.safeParse(event.message.usage);
    if (!usage.success) {
      continue;
    }
    const tokens =
      (usage.data.input_tokens ?? 0) +
      (usage.data.cache_read_input_tokens ?? 0) +
      (usage.data.cache_creation_input_tokens ?? 0);
    const model = typeof event.message.model === "string" ? event.message.model : null;
    if (!best || tokens > best.tokens) {
      best = { tokens, model };
    }
  }

  return best;
}

function sumCost(models: Array<{ costUsd: number | null }>): number | null {
  const known = models.flatMap((model) => (model.costUsd === null ? [] : [model.costUsd]));
  if (known.length === 0) {
    return null;
  }
  return known.reduce((total, value) => total + value, 0);
}

function parseEvents(raw: string): Array<Record<string, unknown>> {
  const trimmed = raw.trim();
  if (!trimmed) {
    return [];
  }
  const direct = tryParse(trimmed);
  if (isRecord(direct)) {
    return [direct];
  }
  return trimmed
    .split(/\r?\n/)
    .map((line) => tryParse(line.trim()))
    .filter(isRecord);
}

function tryParse(text: string): unknown | undefined {
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return undefined;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}
