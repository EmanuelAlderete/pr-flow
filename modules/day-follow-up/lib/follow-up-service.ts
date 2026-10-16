import type { DailySummaryContext, StandupBeat } from "@/modules/notebook-day";
import { buildNotebookDayContext } from "@/modules/notebook-day";
import { generateLlmText } from "@/modules/llm-generation";
import { ptBR } from "@/modules/messages";
import { resolveSummaryCronTimezone } from "@/modules/cron-scheduling/lib/summary-timezone";
import { generateAndPersistDailySummary } from "@/modules/summaries/lib/summary-generation-service";
import { getSummaryByTypeAndPeriod } from "@/modules/summaries/lib/summary-repository";
import { isQuizWindowOpen } from "@/modules/day-follow-up/lib/quiz-window";
import {
  createDrizzleFollowUpStore,
  gapFactsFromAnswers,
  type FollowUpStore,
  type QuizAnswerKind,
  type StandupScriptRecord
} from "@/modules/day-follow-up/lib/repository";
import {
  assembleSubsidy,
  buildQuestionPrompt,
  buildStandupScriptDraft,
  classifyNextQuestion,
  type Subsidy
} from "@/modules/day-follow-up/lib/subsidy";

export type FollowUpDeps = {
  now: Date;
  timeZone: string;
  loadContext: (day: string) => Promise<DailySummaryContext>;
  store: FollowUpStore;
  phraseQuestion: (prompt: string) => Promise<string>;
  refreshSummary: (day: string) => Promise<void>;
};

export type DayFollowUpView = {
  notebookDay: string;
  windowOpen: boolean;
  script: StandupScriptRecord | null;
  summary: { content: string; generatedAt: string } | null;
};

export type NextQuestionResult =
  | { status: "question"; kind: "gap"; beat: StandupBeat; question: string }
  | { status: "question"; kind: "mentoring"; beat: null; question: string }
  | { status: "none"; message: string };

export type SubmitAnswerResult =
  | { status: "saved"; script: StandupScriptRecord | null }
  | { status: "window_closed"; message: string }
  | { status: "none"; message: string };

const fallbackQuestion: Record<StandupBeat | "mentoring", string> = {
  yesterday: "O que ficou de fora sobre o que você fez ontem?",
  today: "Qual é o próximo passo que já está visível para hoje?",
  blocker: "O que está bloqueando, se houver algo concreto?",
  mentoring: "Como você lê esse sinal para a sua evolução?"
};

export function createDefaultFollowUpDeps(now: Date = new Date()): FollowUpDeps {
  return {
    now,
    timeZone: resolveSummaryCronTimezone(),
    loadContext: buildNotebookDayContext,
    store: createDrizzleFollowUpStore(),
    phraseQuestion: async (prompt) => {
      try {
        return await generateLlmText(prompt);
      } catch {
        return "";
      }
    },
    refreshSummary: async (day) => {
      await generateAndPersistDailySummary(day, { refresh: true, now });
    }
  };
}

function windowFor(day: string, script: StandupScriptRecord | null, deps: FollowUpDeps): boolean {
  return isQuizWindowOpen({
    notebookDay: day,
    now: deps.now,
    timeZone: deps.timeZone,
    scriptUsed: script?.status === "used"
  });
}

async function subsidyFor(day: string, deps: FollowUpDeps): Promise<Subsidy> {
  const [context, answers] = await Promise.all([
    deps.loadContext(day),
    deps.store.listAnswers(day)
  ]);
  return assembleSubsidy(context, gapFactsFromAnswers(answers));
}

export async function refreshStandupScript(
  day: string,
  deps: FollowUpDeps
): Promise<StandupScriptRecord> {
  const existing = await deps.store.getScript(day);
  const open = windowFor(day, existing, deps);

  if (existing && (existing.status === "used" || !open)) {
    if (existing.status !== "used") {
      return deps.store.saveScript({ ...existing, status: "used" });
    }
    return existing;
  }

  const subsidy = await subsidyFor(day, deps);
  const content = buildStandupScriptDraft(subsidy);
  return deps.store.saveScript({
    notebookDay: day,
    content,
    status: open ? "draft" : "used"
  });
}

export async function loadDayFollowUp(day: string, deps: FollowUpDeps = createDefaultFollowUpDeps()): Promise<DayFollowUpView> {
  const script = await refreshStandupScript(day, deps);
  const summary = await getSummaryByTypeAndPeriod("daily", day);
  return {
    notebookDay: day,
    windowOpen: windowFor(day, script, deps),
    script,
    summary: summary ? { content: summary.content, generatedAt: summary.generatedAt } : null
  };
}

export async function markStandupScriptUsed(
  day: string,
  deps: FollowUpDeps = createDefaultFollowUpDeps()
): Promise<StandupScriptRecord> {
  const current = (await deps.store.getScript(day)) ?? (await refreshStandupScript(day, deps));
  if (current.status === "used") {
    return current;
  }
  return deps.store.saveScript({ ...current, status: "used" });
}

async function phrase(
  decision: Exclude<ReturnType<typeof classifyNextQuestion>, { kind: "none" }>,
  subsidy: Subsidy,
  deps: FollowUpDeps
): Promise<string> {
  const generated = (await deps.phraseQuestion(buildQuestionPrompt(decision, subsidy))).trim();
  if (generated.length > 0) {
    return generated;
  }
  if (decision.kind === "gap") {
    return fallbackQuestion[decision.beat];
  }
  return fallbackQuestion.mentoring;
}

export async function requestNextQuestion(
  day: string,
  deps: FollowUpDeps = createDefaultFollowUpDeps()
): Promise<NextQuestionResult> {
  const script = await deps.store.getScript(day);
  if (!windowFor(day, script, deps)) {
    return { status: "none", message: ptBR.followUp.windowClosed };
  }

  const subsidy = await subsidyFor(day, deps);
  const decision = classifyNextQuestion(subsidy);
  if (decision.kind === "none") {
    return { status: "none", message: ptBR.followUp.noNextQuestion };
  }

  const question = await phrase(decision, subsidy, deps);
  if (decision.kind === "gap") {
    return { status: "question", kind: "gap", beat: decision.beat, question };
  }
  return { status: "question", kind: "mentoring", beat: null, question };
}

export async function submitQuizAnswer(
  input: {
    notebookDay: string;
    kind: QuizAnswerKind;
    beat: StandupBeat | null;
    question: string;
    answer: string;
  },
  deps: FollowUpDeps = createDefaultFollowUpDeps()
): Promise<SubmitAnswerResult> {
  const existing = await deps.store.getScript(input.notebookDay);
  if (!windowFor(input.notebookDay, existing, deps)) {
    return { status: "window_closed", message: ptBR.followUp.answerRejected };
  }

  const subsidy = await subsidyFor(input.notebookDay, deps);
  const decision = classifyNextQuestion(subsidy);
  if (decision.kind === "none" || decision.kind !== input.kind) {
    return { status: "none", message: ptBR.followUp.noNextQuestion };
  }
  if (decision.kind === "gap" && decision.beat !== input.beat) {
    return { status: "none", message: ptBR.followUp.noNextQuestion };
  }

  await deps.store.insertAnswer({
    notebookDay: input.notebookDay,
    kind: input.kind,
    beat: input.kind === "gap" ? input.beat : null,
    question: input.question,
    answer: input.answer
  });

  const script =
    input.kind === "gap" ? await refreshStandupScript(input.notebookDay, deps) : existing;

  await deps.refreshSummary(input.notebookDay);

  return { status: "saved", script };
}
