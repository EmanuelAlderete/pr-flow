import type { JiraSprintDto } from "@/modules/jira/lib/domain";

export type JiraSprintFilterValue = "all" | "open" | `${number}`;

export function resolveDefaultSprintFilter(sprints: JiraSprintDto[]): JiraSprintFilterValue {
  const active = sprints.find((sprint) => sprint.state === "active");
  return active ? `${active.id}` : "all";
}
