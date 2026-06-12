import { describe, expect, it } from "vitest";
import { resolveDefaultSprintFilter } from "@/modules/jira/lib/jira-sprint-filter";
import type { JiraSprintDto } from "@/modules/jira/lib/domain";

const sprint = (partial: Partial<JiraSprintDto> & Pick<JiraSprintDto, "id" | "name" | "state">): JiraSprintDto => ({
  startDate: null,
  endDate: null,
  ...partial
});

describe("resolveDefaultSprintFilter", () => {
  it("seleciona a sprint ativa quando existir", () => {
    expect(
      resolveDefaultSprintFilter([
        sprint({ id: 10, name: "Sprint fechada", state: "closed" }),
        sprint({ id: 42, name: "Sprint ativa", state: "active" }),
        sprint({ id: 99, name: "Sprint futura", state: "future" })
      ])
    ).toBe("42");
  });

  it("usa todas as sprints quando nao houver sprint ativa", () => {
    expect(
      resolveDefaultSprintFilter([
        sprint({ id: 10, name: "Sprint fechada", state: "closed" }),
        sprint({ id: 99, name: "Sprint futura", state: "future" })
      ])
    ).toBe("all");
  });
});
