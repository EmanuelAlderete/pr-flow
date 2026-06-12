import { z } from "zod";

const devStatusBranchSchema = z
  .object({
    name: z.string().optional(),
    url: z.string().optional(),
    repositoryName: z.string().optional()
  })
  .passthrough();

const devStatusPullRequestSchema = z
  .object({
    source: z
      .object({
        branch: z.string().optional(),
        url: z.string().optional()
      })
      .optional(),
    status: z.string().optional(),
    repositoryName: z.string().optional()
  })
  .passthrough();

const devStatusDetailSchema = z
  .object({
    branches: z.array(devStatusBranchSchema).optional(),
    pullRequests: z.array(devStatusPullRequestSchema).optional()
  })
  .passthrough();

export const jiraDevStatusResponseSchema = z.object({
  errors: z.array(z.unknown()).optional(),
  detail: z.array(devStatusDetailSchema).optional()
});

export type JiraDevStatusResponse = z.infer<typeof jiraDevStatusResponseSchema>;

export type JiraDevStatusBranchRef = {
  branchName: string;
  repository: string;
};
