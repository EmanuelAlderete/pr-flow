import { z } from "zod";

export const slackPostMessageResponseSchema = z.object({
  ok: z.boolean(),
  error: z.string().optional(),
  ts: z.string().optional(),
  channel: z.string().optional()
});

export type SlackPostMessageResponse = z.infer<typeof slackPostMessageResponseSchema>;
