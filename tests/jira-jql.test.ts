import { describe, expect, it } from "vitest";
import { buildAssignedIssuesJql, parseJiraSprintFilter } from "@/modules/jira/lib/jira-jql";

describe("jira-jql", () => {
  it("parses sprint filter values", () => {
    expect(parseJiraSprintFilter(null)).toBe("all");
    expect(parseJiraSprintFilter("all")).toBe("all");
    expect(parseJiraSprintFilter("open")).toBe("open");
    expect(parseJiraSprintFilter("4943")).toBe("4943");
  });

  it("rejects invalid sprint filter", () => {
    expect(() => parseJiraSprintFilter("active")).toThrow(/inválido/i);
  });

  it("builds JQL with sprint clauses", () => {
    expect(buildAssignedIssuesJql("all")).toContain("assignee = currentUser()");
    expect(buildAssignedIssuesJql("all")).not.toContain("sprint");

    expect(buildAssignedIssuesJql("open")).toContain("sprint in openSprints()");
    expect(buildAssignedIssuesJql("4943")).toContain("sprint = 4943");
  });
});
