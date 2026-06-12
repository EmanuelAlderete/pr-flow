import { describe, expect, it } from "vitest";
import { extractDevStatusBranchesForRepository } from "@/modules/jira/lib/jira-dev-status-service";

const jor183Fixture = {
  errors: [],
  detail: [
    {
      branches: [],
      pullRequests: [
        {
          source: {
            branch: "feat/JOR-183/add-about-to-menu",
            url: "https://github.com/jusfy/jusfy-front/tree/feat%2FJOR-183%2Fadd-about-to-menu"
          },
          status: "MERGED",
          repositoryName: "jusfy/jusfy-front"
        },
        {
          source: {
            branch: "feat/JOR-183/wip-menu",
            url: "https://github.com/jusfy/jusfy-front/tree/feat/JOR-183/wip-menu"
          },
          status: "OPEN",
          repositoryName: "jusfy/jusfy-front"
        }
      ]
    }
  ]
};

describe("extractDevStatusBranchesForRepository", () => {
  it("ignora PRs mergeadas e filtra pelo repositorio", () => {
    const branches = extractDevStatusBranchesForRepository(jor183Fixture, "jusfy/jusfy-front");

    expect(branches).toEqual([
      {
        branchName: "feat/JOR-183/wip-menu",
        repository: "jusfy/jusfy-front"
      }
    ]);
  });

  it("nao retorna branches de outro repositorio", () => {
    const branches = extractDevStatusBranchesForRepository(jor183Fixture, "acme/other");

    expect(branches).toEqual([]);
  });
});
