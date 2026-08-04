/** Bug → fix/; other issue types → feat/. */
export function resolveBranchPrefixFromIssueType(issueTypeName: string): "feat" | "fix" {
  return issueTypeName.trim().toLowerCase() === "bug" ? "fix" : "feat";
}

export function buildTicketBranchName(
  prefix: "feat" | "fix",
  issueKey: string,
  slug: string
): string {
  const keySegment = issueKey.trim().toLowerCase();
  return `${prefix}/${keySegment}/${slug.trim()}`;
}
