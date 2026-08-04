import { z } from "zod";

export const composePsRowSchema = z.object({
  Service: z.string(),
  Name: z.string(),
  State: z.string(),
  Status: z.string(),
  Health: z.string().optional()
});

export type ComposePsRow = z.infer<typeof composePsRowSchema>;

export function parseComposePsJson(stdout: string): ComposePsRow[] {
  const rows: ComposePsRow[] = [];

  for (const line of stdout.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed) {
      continue;
    }

    let payload: unknown;
    try {
      payload = JSON.parse(trimmed);
    } catch {
      continue;
    }

    const parsed = composePsRowSchema.safeParse(payload);
    if (parsed.success) {
      rows.push(parsed.data);
    }
  }

  return rows;
}
