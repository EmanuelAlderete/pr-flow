import { z } from "zod";
import { LOCAL_REVIEW_MODEL_IDS } from "@/modules/prs/lib/local-review/local-review-models";

export const localReviewTriggerSchema = z.object({
  repository: z.string().regex(/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/),
  number: z.number().int().positive(),
  model: z.enum(LOCAL_REVIEW_MODEL_IDS).default("haiku")
});

export type LocalReviewTrigger = z.infer<typeof localReviewTriggerSchema>;
