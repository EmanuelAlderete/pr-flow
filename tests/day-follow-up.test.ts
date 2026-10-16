import { beforeEach, describe, expect, it, vi } from "vitest";
import type { DailySummaryContext, DailySummaryPrItem } from "@/modules/notebook-day";
import { createMemoryFollowUpStore } from "@/modules/day-follow-up/lib/memory-store";
import {
  markStandupScriptUsed,
  refreshStandupScript,
  requestNextQuestion,
  submitQuizAnswer,
  type FollowUpDeps
} from "@/modules/day-follow-up/lib/follow-up-service";
import {
  assembleSubsidy,
  buildQuestionPrompt,
  buildStandupScriptDraft,
  classifyNextQuestion,
  type Subsidy
} from "@/modules/day-follow-up/lib/subsidy";

const DAY = "2026-08-07";
const OPEN_NOW = new Date("2026-08-07T15:00:00-03:00");

function emptyContext(overrides: Partial<DailySummaryContext> = {}): DailySummaryContext {
  return {
    day: DAY,
    noteBody: null,
    pendingTasks: [],
    completedTodayTasks: [],
    jira: { sprintLabel: null, issues: [] },
    prs: {
      githubLogin: "rigon",
      syncedAt: null,
      myOpenPrs: [],
      reviewsGivenToday: [],
      reviewsReceivedToday: [],
      pendingReviews: [],
      statusChangesToday: [],
      mergesToday: []
    },
    gitActivity: [],
    ...overrides
  };
}

function changesRequestedPr(): DailySummaryPrItem {
  return {
    number: 42,
    title: "API maior",
    url: "https://github.com/acme/app/pull/42",
    repository: "acme/app",
    statusGeral: "changes_requested",
    jiraIssueKey: "PROJ-2",
    aprovou: [],
    solicitouAlteracoes: ["alice"],
    pendente: [],
    impediments: []
  };
}

function emptySubsidy(overrides: Partial<Subsidy> = {}): Subsidy {
  return {
    day: DAY,
    noteBody: null,
    commits: [],
    jiraKeysUpdated: [],
    completedTasks: [],
    pendingTasks: [],
    reviewsGiven: [],
    openPullRequests: [],
    gapFacts: [],
    ...overrides
  };
}

function deps(context: DailySummaryContext, now = OPEN_NOW): FollowUpDeps & { refreshSummary: ReturnType<typeof vi.fn> } {
  const refreshSummary = vi.fn(async () => undefined);
  return {
    now,
    timeZone: "America/Sao_Paulo",
    loadContext: async () => context,
    store: createMemoryFollowUpStore(),
    phraseQuestion: async () => "O que fechou em PROJ-9?",
    refreshSummary
  };
}

describe("standup script window", () => {
  it("does not change the note and freezes the draft after it is marked used", async () => {
    const context = emptyContext({
      noteBody: "nota original",
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
    const followUp = deps(context);
    const draft = await refreshStandupScript(DAY, followUp);

    expect(context.noteBody).toBe("nota original");
    expect(draft.status).toBe("draft");
    expect(draft.content.yesterday).toContain("PROJ-9");

    const used = await markStandupScriptUsed(DAY, followUp);
    context.gitActivity = [
      {
        sha: "fff1234567890",
        message: "PROJ-1 outro fato",
        repository: "acme/app",
        jiraIssueKey: "PROJ-1",
        pullRequestNumber: null
      }
    ];
    const again = await refreshStandupScript(DAY, followUp);

    expect(used.status).toBe("used");
    expect(again.content).toEqual(used.content);
    expect(again.content.yesterday).not.toContain("PROJ-1");
  });

  it("keeps the window open when the draft is only read, including Saturday after Friday", async () => {
    const followUp = deps(emptyContext({ noteBody: "bloqueio: fila" }));
    const first = await refreshStandupScript(DAY, followUp);
    const reread = await refreshStandupScript(DAY, followUp);

    expect(first.status).toBe("draft");
    expect(reread.status).toBe("draft");

    const saturday = deps(emptyContext({ noteBody: "bloqueio: fila" }), new Date("2026-08-08T15:00:00-03:00"));
    saturday.store = followUp.store;
    const stillDraft = await refreshStandupScript(DAY, saturday);
    expect(stillDraft.status).toBe("draft");
  });

  it("freezes the existing draft after the next business day ends", async () => {
    const followUp = deps(
      emptyContext({
        gitActivity: [
          {
            sha: "abc1234567890",
            message: "PROJ-9 fecha o contrato",
            repository: "acme/app",
            jiraIssueKey: "PROJ-9",
            pullRequestNumber: null
          }
        ]
      })
    );
    const draft = await refreshStandupScript(DAY, followUp);
    const later = deps(
      emptyContext({
        gitActivity: [
          {
            sha: "fff1234567890",
            message: "PROJ-1 outro fato",
            repository: "acme/app",
            jiraIssueKey: "PROJ-1",
            pullRequestNumber: null
          }
        ]
      }),
      new Date("2026-08-11T00:30:00-03:00")
    );
    later.store = followUp.store;

    const frozen = await refreshStandupScript(DAY, later);

    expect(frozen.status).toBe("used");
    expect(frozen.content).toEqual(draft.content);
  });
});

describe("quiz answers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("asks a gap only after it is requested and skips facts the sweep already shows", async () => {
    const unexplained = emptyContext({
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
    const followUp = deps(unexplained);
    expect(await followUp.store.listAnswers(DAY)).toEqual([]);

    const asked = await requestNextQuestion(DAY, followUp);
    expect(asked).toMatchObject({ status: "question", kind: "gap", beat: "yesterday" });

    const explained = assembleSubsidy(
      emptyContext({
        noteBody: "PROJ-9 fecha o contrato",
        gitActivity: unexplained.gitActivity
      })
    );
    expect(classifyNextQuestion(explained)).toEqual({ kind: "none" });

    const prompt = buildQuestionPrompt(
      { kind: "gap", beat: "yesterday" },
      assembleSubsidy(unexplained)
    );
    expect(prompt).toContain("Não pergunte fatos que já estão na varredura");
    expect(prompt).toContain("PROJ-9 fecha o contrato");
  });

  it("stores a gap answer in the subsidy and rewrites that beat of the draft", async () => {
    const context = emptyContext({
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
    const followUp = deps(context);
    await refreshStandupScript(DAY, followUp);

    const saved = await submitQuizAnswer(
      {
        notebookDay: DAY,
        kind: "gap",
        beat: "yesterday",
        question: "O que fechou em PROJ-9?",
        answer: "fechei o contrato com o cliente"
      },
      followUp
    );

    expect(saved.status).toBe("saved");
    if (saved.status === "saved") {
      expect(saved.script?.content.yesterday).toContain("fechei o contrato com o cliente");
    }
    expect(followUp.refreshSummary).toHaveBeenCalledWith(DAY);
    const answers = await followUp.store.listAnswers(DAY);
    expect(answers.map((answer) => answer.kind)).toEqual(["gap"]);
  });

  it("rejects an answer after the script is used and still drafts from the sweep with no answers", async () => {
    const context = emptyContext({
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
    const followUp = deps(context);
    const draft = await refreshStandupScript(DAY, followUp);
    expect(draft.content.yesterday).toContain("PROJ-9");
    expect(await followUp.store.listAnswers(DAY)).toEqual([]);

    await markStandupScriptUsed(DAY, followUp);
    const rejected = await submitQuizAnswer(
      {
        notebookDay: DAY,
        kind: "gap",
        beat: "yesterday",
        question: "O que fechou?",
        answer: "não deve gravar"
      },
      followUp
    );

    expect(rejected.status).toBe("window_closed");
    expect(await followUp.store.listAnswers(DAY)).toEqual([]);
    expect(followUp.refreshSummary).not.toHaveBeenCalled();
    expect((await followUp.store.getScript(DAY))?.content).toEqual(draft.content);
  });

  it("keeps mentoring out of the script and prefers an open gap", async () => {
    const withGapAndSignal = emptyContext({
      noteBody: null,
      gitActivity: [
        {
          sha: "abc1234567890",
          message: "PROJ-9 fecha o contrato",
          repository: "acme/app",
          jiraIssueKey: "PROJ-9",
          pullRequestNumber: null
        }
      ],
      prs: {
        githubLogin: "rigon",
        syncedAt: null,
        myOpenPrs: [changesRequestedPr()],
        reviewsGivenToday: [],
        reviewsReceivedToday: [],
        pendingReviews: [],
        statusChangesToday: [],
        mergesToday: []
      }
    });
    expect(classifyNextQuestion(assembleSubsidy(withGapAndSignal)).kind).toBe("gap");

    const mentoringContext = emptyContext({
      prs: {
        githubLogin: "rigon",
        syncedAt: null,
        myOpenPrs: [changesRequestedPr()],
        reviewsGivenToday: [],
        reviewsReceivedToday: [],
        pendingReviews: [],
        statusChangesToday: [],
        mergesToday: []
      }
    });
    const followUp = deps(mentoringContext);
    const before = await refreshStandupScript(DAY, followUp);
    const asked = await requestNextQuestion(DAY, followUp);
    expect(asked).toMatchObject({ status: "question", kind: "mentoring" });

    const saved = await submitQuizAnswer(
      {
        notebookDay: DAY,
        kind: "mentoring",
        beat: null,
        question: "Como você lê o pedido de alteração?",
        answer: "pedi mudança cedo demais"
      },
      followUp
    );

    expect(saved.status).toBe("saved");
    expect((await followUp.store.getScript(DAY))?.content).toEqual(before.content);
    expect(JSON.stringify((await followUp.store.getScript(DAY))?.content)).not.toContain("cedo demais");
    const subsidy = assembleSubsidy(mentoringContext, []);
    expect(buildStandupScriptDraft(subsidy).yesterday).not.toContain("cedo demais");
    expect(followUp.refreshSummary).toHaveBeenCalledWith(DAY);

    const explained = assembleSubsidy(
      emptyContext({
        noteBody: "A #42 já está explicada na nota",
        prs: mentoringContext.prs
      })
    );
    expect(classifyNextQuestion(explained)).toEqual({ kind: "none" });
  });

  it("returns no question when there is no gap and no career signal", async () => {
    const followUp = deps(emptyContext());
    const asked = await requestNextQuestion(DAY, followUp);
    expect(asked).toEqual({ status: "none", message: "Não há próxima pergunta." });
  });

  it("asks mentoring for an oversized pull request that the note does not explain", () => {
    const decision = classifyNextQuestion(
      emptySubsidy({
        openPullRequests: [
          {
            number: 1,
            title: "Pequena",
            repository: "acme/app",
            jiraIssueKey: null,
            changesRequested: false,
            impediments: [],
            additions: 10
          },
          {
            number: 3,
            title: "Média",
            repository: "acme/app",
            jiraIssueKey: null,
            changesRequested: false,
            impediments: [],
            additions: 20
          },
          {
            number: 2,
            title: "Enorme",
            repository: "acme/app",
            jiraIssueKey: null,
            changesRequested: false,
            impediments: [],
            additions: 400
          }
        ]
      })
    );

    expect(decision).toEqual({ kind: "mentoring", signal: "oversized_pr" });
  });
});
