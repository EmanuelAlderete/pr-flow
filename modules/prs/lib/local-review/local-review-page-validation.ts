import { z } from "zod";

const slug = z.string().regex(/^[A-Za-z0-9_.-]+$/);

export const localReviewPageParamsSchema = z.object({
  owner: slug,
  repo: slug,
  number: z.coerce.number().int().positive()
});
