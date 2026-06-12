import { z } from "zod";
import { DEFAULT_OPEN_PR_BASE_BRANCH, DEFAULT_OPEN_PR_REVIEWERS } from "@/modules/prs/lib/open-pr/constants";

const repositorySchema = z
  .string()
  .trim()
  .regex(/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/, "Repositório inválido. Use owner/repo.");

const branchNameSchema = z
  .string()
  .trim()
  .min(1, "Nome da branch é obrigatório.")
  .max(255, "Nome da branch muito longo.");

const titleSchema = z
  .string()
  .trim()
  .min(1, "Título é obrigatório.")
  .max(256, "Título deve ter no máximo 256 caracteres.");

const bodySchema = z
  .string()
  .trim()
  .min(1, "Corpo da PR é obrigatório.")
  .max(65_000, "Corpo da PR excede o limite suportado.");

const reviewerSchema = z
  .string()
  .trim()
  .min(1)
  .max(39)
  .regex(/^[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,37}[a-zA-Z0-9])?$/, "Login de revisor inválido.");

export const openPrBranchesQuerySchema = z.object({
  repository: repositorySchema
});

export const openPrGenerateBodySchema = z.object({
  repository: repositorySchema,
  branch: branchNameSchema,
  baseBranch: z.string().trim().min(1).default(DEFAULT_OPEN_PR_BASE_BRANCH)
});

export const openPrCreateSchema = z.object({
  repository: repositorySchema,
  branch: branchNameSchema,
  title: titleSchema,
  body: bodySchema,
  baseBranch: z.string().trim().min(1).default(DEFAULT_OPEN_PR_BASE_BRANCH),
  reviewers: z
    .array(reviewerSchema)
    .min(1, "Informe ao menos um revisor.")
    .max(10)
    .default([...DEFAULT_OPEN_PR_REVIEWERS])
});

export type OpenPrGenerateBodyInput = z.infer<typeof openPrGenerateBodySchema>;
export type OpenPrCreateInput = z.infer<typeof openPrCreateSchema>;

export function formatZodError(error: z.ZodError): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".") || "_form";
    if (!errors[key]) {
      errors[key] = issue.message;
    }
  }
  return errors;
}
