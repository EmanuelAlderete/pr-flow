import { describe, expect, it } from "vitest";
import { buildPrShareMessage } from "@/modules/prs/lib/core/pr-share-message";

describe("buildPrShareMessage", () => {
  it("monta mensagem com ticket Jira e link da PR", () => {
    expect(
      buildPrShareMessage({
        title: "JOR-1234 Ajuste no monitor",
        url: "https://github.com/acme/a/pull/7"
      })
    ).toBe(
      "JOR-1234 Ajuste no monitor: https://jusfy.atlassian.net/browse/JOR-1234\n\n- https://github.com/acme/a/pull/7"
    );
  });

  it("usa link da PR na primeira linha quando nao houver ticket Jira", () => {
    expect(
      buildPrShareMessage({
        title: "fix: simplify retries",
        url: "https://github.com/acme/a/pull/7"
      })
    ).toBe("fix: simplify retries: https://github.com/acme/a/pull/7\n\n- https://github.com/acme/a/pull/7");
  });
});
