import { describe, expect, it } from "vitest";
import { buildDailySummaryPrompt, contextHasSummaryInput, selectAuthoredCommits } from "@/modules/notebook-day";

describe("selectAuthoredCommits", () => {
  it("keeps the person's commit in a monitored repo and drops diff, other authors, and other repos", () => {
    const commits = selectAuthoredCommits({
      authorLogin: "rigon",
      monitoredRepositories: ["acme/app"],
      commits: [
        {
          sha: "abc1234567890",
          message: "PROJ-9 fecha o contrato (#41)",
          repository: "acme/app",
          authorLogin: "rigon",
          diff: "diff --git a/file.ts"
        },
        {
          sha: "def1234567890",
          message: "alguém mais",
          repository: "acme/app",
          authorLogin: "alice"
        },
        {
          sha: "ghi1234567890",
          message: "fora da lista",
          repository: "other/repo",
          authorLogin: "rigon"
        }
      ]
    });

    expect(commits).toEqual([
      {
        sha: "abc1234567890",
        message: "PROJ-9 fecha o contrato (#41)",
        repository: "acme/app",
        jiraIssueKey: "PROJ-9",
        pullRequestNumber: 41
      }
    ]);
    expect(commits[0]).not.toHaveProperty("diff");
  });
});

describe("git activity as summary input", () => {
  it("counts authored commits and leaves a day without them to the rest of the sweep", () => {
    const withCommit = contextHasSummaryInput({
      day: "2026-08-07",
      noteBody: null,
      pendingTasks: [],
      completedTodayTasks: [],
      jira: null,
      prs: null,
      gitActivity: [
        {
          sha: "abc1234567890",
          message: "PROJ-1",
          repository: "acme/app",
          jiraIssueKey: "PROJ-1",
          pullRequestNumber: null
        }
      ]
    });
    const withoutCommit = contextHasSummaryInput({
      day: "2026-08-07",
      noteBody: null,
      pendingTasks: [],
      completedTodayTasks: [],
      jira: null,
      prs: null,
      gitActivity: []
    });

    expect(withCommit).toBe(true);
    expect(withoutCommit).toBe(false);
  });

  it("puts the commit message in the daily summary prompt and omits diffs", () => {
    const prompt = buildDailySummaryPrompt({
      day: "2026-08-07",
      noteBody: null,
      pendingTasks: [],
      completedTodayTasks: [],
      jira: null,
      prs: null,
      gitActivity: [
        {
          sha: "abc1234567890",
          message: "PROJ-9 fecha o contrato",
          repository: "acme/app",
          jiraIssueKey: "PROJ-9",
          pullRequestNumber: null
        }
      ]
    });

    expect(prompt).toContain("PROJ-9 fecha o contrato");
    expect(prompt).toContain("Atividade Git");
    expect(prompt).not.toContain("diff --git");
  });
});
