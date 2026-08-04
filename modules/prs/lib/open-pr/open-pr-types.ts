export type OpenPrBranchItem = {
  name: string;
  issueKey: string | null;
  suggestedTitle: string | null;
  jiraSummary: string | null;
  baseBranch: string | null;
};

export type OpenPrBranchSource = "jira" | "github";

export type OpenPrBranchesResult =
  | { status: "ok"; branches: OpenPrBranchItem[]; githubLogin: string; branchSource: OpenPrBranchSource }
  | { status: "unauthenticated"; message: string }
  | { status: "error"; message: string };
