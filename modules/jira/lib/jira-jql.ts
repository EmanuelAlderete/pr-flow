export type JiraSprintFilter = "all" | "open" | string;

export function parseJiraSprintFilter(value: string | null | undefined): JiraSprintFilter {
  const normalized = value?.trim();
  if (!normalized || normalized === "all") {
    return "all";
  }
  if (normalized === "open") {
    return "open";
  }
  if (/^\d+$/.test(normalized)) {
    return normalized;
  }
  throw new Error("Parâmetro sprint inválido. Use all, open ou o id numérico da sprint.");
}

export function buildAssignedIssuesJql(sprintFilter: JiraSprintFilter = "all"): string {
  const clauses = ["assignee = currentUser()", "resolution = Unresolved"];

  if (sprintFilter === "open") {
    clauses.push("sprint in openSprints()");
  } else if (sprintFilter !== "all") {
    clauses.push(`sprint = ${sprintFilter}`);
  }

  return `${clauses.join(" AND ")} ORDER BY updated DESC`;
}
