import type {
  AuthoredCommit,
  DailySummaryContext,
  DailySummaryPrItem,
  GapFact,
  StandupBeat
} from "@/modules/notebook-day";

export type SubsidyPullRequest = {
  number: number;
  title: string;
  repository: string;
  jiraIssueKey: string | null;
  changesRequested: boolean;
  impediments: string[];
  additions: number | null;
};

export type Subsidy = {
  day: string;
  noteBody: string | null;
  commits: AuthoredCommit[];
  jiraKeysUpdated: string[];
  completedTasks: string[];
  pendingTasks: string[];
  reviewsGiven: string[];
  openPullRequests: SubsidyPullRequest[];
  gapFacts: GapFact[];
};

export type StandupScriptContent = {
  yesterday: string;
  today: string;
  blocker: string;
};

const BLOCKER_HINT = /bloqueio|impedimento|impediment/i;
const SPECIFIC_BLOCKER = /(?:bloqueio|impedimento)\s*:\s*\S+/i;
const NEXT_STEP = /próximo passo\s*:\s*(.+)|proximo passo\s*:\s*(.+)|hoje vou\s+(.+)/i;
const REPEATED_BLOCKER = /ainda bloquead|bloqueio de novo|continua bloquead/i;

function noteIncludes(note: string | null, token: string): boolean {
  if (!note || token.trim().length === 0) {
    return false;
  }
  return note.toLowerCase().includes(token.toLowerCase());
}

function mapOpenPr(pr: DailySummaryPrItem): SubsidyPullRequest {
  return {
    number: pr.number,
    title: pr.title,
    repository: pr.repository,
    jiraIssueKey: pr.jiraIssueKey,
    changesRequested: pr.statusGeral === "changes_requested",
    impediments: pr.impediments,
    additions: null
  };
}

/** Work facts only. Mentoring readings are not part of the subsidy. */
export function assembleSubsidy(context: DailySummaryContext, gapFacts: GapFact[] = []): Subsidy {
  const jiraKeysUpdated =
    context.jira?.issues.filter((issue) => issue.updatedOnDay).map((issue) => issue.key) ?? [];

  return {
    day: context.day,
    noteBody: context.noteBody,
    commits: context.gitActivity ?? [],
    jiraKeysUpdated,
    completedTasks: context.completedTodayTasks.map((task) => task.title),
    pendingTasks: context.pendingTasks.map((task) => task.title),
    reviewsGiven: (context.prs?.reviewsGivenToday ?? []).map(
      (review) => `#${review.prNumber} ${review.prTitle}`
    ),
    openPullRequests: (context.prs?.myOpenPrs ?? []).map(mapOpenPr),
    gapFacts
  };
}

function groupYesterday(subsidy: Subsidy): string {
  const lines: string[] = [];
  const seen = new Set<string>();

  function push(key: string, detail: string) {
    const label = key || "(sem ticket)";
    const id = `${label}:${detail}`;
    if (seen.has(id)) {
      return;
    }
    seen.add(id);
    lines.push(`${label}: ${detail}`);
  }

  for (const commit of subsidy.commits) {
    const subject = commit.message.split("\n")[0];
    push(commit.jiraIssueKey ?? "", subject);
  }

  for (const key of subsidy.jiraKeysUpdated) {
    push(key, "ticket movimentado");
  }

  for (const title of subsidy.completedTasks) {
    push("", title);
  }

  for (const review of subsidy.reviewsGiven) {
    push("", `review ${review}`);
  }

  for (const fact of subsidy.gapFacts.filter((item) => item.beat === "yesterday")) {
    lines.push(fact.answer);
  }

  return lines.length > 0 ? lines.join("\n") : "(nada registrado na varredura)";
}

function visibleNextStep(subsidy: Subsidy): string | null {
  const todayFact = subsidy.gapFacts.find((fact) => fact.beat === "today");
  if (todayFact) {
    return todayFact.answer;
  }

  const note = subsidy.noteBody ?? "";
  const match = NEXT_STEP.exec(note);
  const captured = match?.slice(1).find((part) => part && part.trim().length > 0);
  if (captured) {
    return captured.trim();
  }

  const mentioned = subsidy.pendingTasks.filter((title) => noteIncludes(note, title));
  if (mentioned.length > 0) {
    return mentioned.join("; ");
  }

  return null;
}

function blockerText(subsidy: Subsidy): string {
  const fact = subsidy.gapFacts.find((item) => item.beat === "blocker");
  if (fact) {
    return fact.answer;
  }

  const note = subsidy.noteBody ?? "";
  const specific = SPECIFIC_BLOCKER.exec(note);
  if (specific) {
    return specific[0];
  }

  const impediment = subsidy.openPullRequests.flatMap((pr) => pr.impediments)[0];
  if (impediment && noteIncludes(note, impediment)) {
    return impediment;
  }

  return "sem bloqueio";
}

export function buildStandupScriptDraft(subsidy: Subsidy): StandupScriptContent {
  return {
    yesterday: groupYesterday(subsidy),
    today: visibleNextStep(subsidy) ?? "sem próximo passo visível",
    blocker: blockerText(subsidy)
  };
}

export type CareerSignal = "changes_requested" | "repeated_blocker" | "oversized_pr";

export type NextQuestionDecision =
  | { kind: "gap"; beat: StandupBeat }
  | { kind: "mentoring"; signal: CareerSignal }
  | { kind: "none" };

function unexplainedTokens(note: string | null, tokens: string[]): string[] {
  return tokens.filter((token) => token.trim().length > 0 && !noteIncludes(note, token));
}

function yesterdayGap(subsidy: Subsidy): boolean {
  if (subsidy.gapFacts.some((fact) => fact.beat === "yesterday")) {
    return false;
  }

  const tokens = [
    ...subsidy.commits.flatMap((commit) => [
      commit.jiraIssueKey ?? "",
      commit.message.split("\n")[0]
    ]),
    ...subsidy.jiraKeysUpdated,
    ...subsidy.completedTasks,
    ...subsidy.reviewsGiven
  ];

  return unexplainedTokens(subsidy.noteBody, tokens).length > 0;
}

function todayGap(subsidy: Subsidy): boolean {
  if (subsidy.gapFacts.some((fact) => fact.beat === "today")) {
    return false;
  }

  if (NEXT_STEP.test(subsidy.noteBody ?? "")) {
    return false;
  }

  return unexplainedTokens(subsidy.noteBody, subsidy.pendingTasks).length > 0;
}

function blockerGap(subsidy: Subsidy): boolean {
  if (subsidy.gapFacts.some((fact) => fact.beat === "blocker")) {
    return false;
  }

  const note = subsidy.noteBody ?? "";
  const hinted = BLOCKER_HINT.test(note) || subsidy.openPullRequests.some((pr) => pr.impediments.length > 0);
  if (!hinted) {
    return false;
  }

  if (SPECIFIC_BLOCKER.test(note)) {
    return false;
  }

  const explainedImpediment = subsidy.openPullRequests
    .flatMap((pr) => pr.impediments)
    .some((impediment) => noteIncludes(note, impediment));

  return !explainedImpediment;
}

function median(values: number[]): number {
  const sorted = [...values].sort((left, right) => left - right);
  const middle = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 0) {
    return (sorted[middle - 1] + sorted[middle]) / 2;
  }
  return sorted[middle];
}

function careerSignal(subsidy: Subsidy): CareerSignal | null {
  const note = subsidy.noteBody ?? "";
  const gapText = subsidy.gapFacts.map((fact) => fact.answer).join("\n");
  const explainedBy = (token: string) => noteIncludes(note, token) || noteIncludes(gapText, token);

  const unexplainedChanges = subsidy.openPullRequests.find((pr) => {
    if (!pr.changesRequested) {
      return false;
    }
    return !explainedBy(`#${pr.number}`) && !explainedBy(pr.title) && !(pr.jiraIssueKey && explainedBy(pr.jiraIssueKey));
  });
  if (unexplainedChanges) {
    return "changes_requested";
  }

  if (REPEATED_BLOCKER.test(note) && !/porque/i.test(note)) {
    return "repeated_blocker";
  }

  const sized = subsidy.openPullRequests.filter((pr) => pr.additions != null);
  if (sized.length >= 2) {
    const typical = median(sized.map((pr) => pr.additions ?? 0));
    const outlier = sized.find((pr) => {
      const additions = pr.additions ?? 0;
      const isOutlier = typical > 0 && additions > typical * 3;
      return isOutlier && !explainedBy(`#${pr.number}`) && !explainedBy(pr.title);
    });
    if (outlier) {
      return "oversized_pr";
    }
  }

  return null;
}

/** Decides the next question before any model call. */
export function classifyNextQuestion(subsidy: Subsidy): NextQuestionDecision {
  if (yesterdayGap(subsidy)) {
    return { kind: "gap", beat: "yesterday" };
  }
  if (todayGap(subsidy)) {
    return { kind: "gap", beat: "today" };
  }
  if (blockerGap(subsidy)) {
    return { kind: "gap", beat: "blocker" };
  }

  const signal = careerSignal(subsidy);
  if (signal) {
    return { kind: "mentoring", signal };
  }

  return { kind: "none" };
}

export function unexplainedForBeat(subsidy: Subsidy, beat: StandupBeat): string[] {
  if (beat === "yesterday") {
    return unexplainedTokens(subsidy.noteBody, [
      ...subsidy.commits.map((commit) => commit.message.split("\n")[0]),
      ...subsidy.jiraKeysUpdated,
      ...subsidy.completedTasks
    ]);
  }
  if (beat === "today") {
    return unexplainedTokens(subsidy.noteBody, [
      ...subsidy.pendingTasks,
      ...subsidy.openPullRequests.map((pr) => pr.title)
    ]);
  }

  return subsidy.openPullRequests.flatMap((pr) => pr.impediments);
}

export function buildQuestionPrompt(
  decision: Exclude<NextQuestionDecision, { kind: "none" }>,
  subsidy: Subsidy
): string {
  if (decision.kind === "gap") {
    const unknown = unexplainedForBeat(subsidy, decision.beat).join("; ") || "(tempo vago)";
    return `Redija uma única pergunta em português do Brasil sobre o tempo "${decision.beat}" do roteiro de daily.
Não pergunte fatos que já estão na varredura.
Ainda não está claro: ${unknown}.
Nota: ${subsidy.noteBody ?? "(vazia)"}`;
  }

  return `Redija uma única pergunta em português do Brasil pedindo a leitura da pessoa sobre o sinal de carreira "${decision.signal}".
Não trate o sinal como fato de entrega. Não pergunte o que a varredura já mostra.
Nota: ${subsidy.noteBody ?? "(vazia)"}`;
}
