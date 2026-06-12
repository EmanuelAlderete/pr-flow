import type { WeeklySummaryContext } from "@/modules/summaries/lib/weekly-summary-context";
import type { WeeklyComparisonDelta } from "@/modules/summaries/lib/weekly-summary-aggregates";
import {
  buildSummaryCareerPersona,
  buildSummaryCareerRules,
  buildSummaryCareerSections,
  buildSummaryPromptGoldenRules,
  buildWeeklySummaryOutputRules
} from "@/modules/summaries/lib/summary-career-coaching";

function formatJiraDayLines(jira: WeeklySummaryContext["days"][number]["context"]["jira"]): string {
  if (!jira?.issues.length) {
    return "(sem tickets Jira no cache ou nenhum atribuído)";
  }

  const updatedToday = jira.issues.filter((issue) => issue.updatedOnDay);
  if (updatedToday.length === 0) {
    return "(nenhum ticket movimentado neste dia)";
  }

  return updatedToday
    .map((issue) => {
      const fallbackTime = [issue.timeSpentLabel, issue.estimateLabel].filter(Boolean).join(" · ");
      const time = issue.hours ?? (fallbackTime || "sem tempo registrado");
      return `- ${issue.key} (${issue.statusName}): ${issue.summary} — ${time}`;
    })
    .join("\n");
}

function formatPrDayLines(prs: WeeklySummaryContext["days"][number]["context"]["prs"]): string {
  if (!prs) {
    return "(cache de PRs não disponível)";
  }

  const parts: string[] = [];

  if (prs.reviewsGivenToday.length > 0) {
    parts.push(
      "Reviews enviados:",
      prs.reviewsGivenToday
        .map((review) => `- #${review.prNumber}: ${reviewStateLabel(review.state)}`)
        .join("\n")
    );
  }

  if (prs.reviewsReceivedToday.length > 0) {
    parts.push(
      "Reviews recebidos:",
      prs.reviewsReceivedToday
        .map(
          (review) =>
            `- #${review.prNumber}: ${review.reviewerLogin} ${reviewStateLabel(review.state).toLowerCase()}`
        )
        .join("\n")
    );
  }

  if (prs.statusChangesToday.length > 0) {
    parts.push(
      "Mudanças de status:",
      prs.statusChangesToday
        .map(
          (change) =>
            `- #${change.prNumber}: ${change.previousStatus} → ${change.nextStatus}`
        )
        .join("\n")
    );
  }

  if (prs.mergesToday.length > 0) {
    parts.push(
      "PRs mergeadas/fechadas:",
      prs.mergesToday.map((merged) => `- #${merged.prNumber}: ${merged.prTitle}`).join("\n")
    );
  }

  if (prs.myOpenPrs.length > 0) {
    parts.push(`PRs abertas: ${prs.myOpenPrs.length}`);
  }

  if (prs.pendingReviews.length > 0) {
    parts.push(`Revisões pendentes na fila: ${prs.pendingReviews.length}`);
  }

  if (parts.length === 0) {
    return "(sem atividade de PR/review neste dia)";
  }

  return parts.join("\n");
}

function reviewStateLabel(state: string): string {
  if (state === "APPROVED") {
    return "Aprovou";
  }
  if (state === "CHANGES_REQUESTED") {
    return "Solicitou alterações";
  }
  if (state === "COMMENTED") {
    return "Comentou";
  }
  return state;
}

function formatDaySnapshot(day: WeeklySummaryContext["days"][number]): string {
  const note = day.context.noteBody?.trim() || "(sem anotação)";
  const pending =
    day.context.pendingTasks.length === 0
      ? "(nenhuma pendente registrada no fechamento do dia)"
      : day.context.pendingTasks.map((task) => `- ${task.title}`).join("\n");
  const completed =
    day.context.completedTodayTasks.length === 0
      ? "(nenhuma concluída neste dia)"
      : day.context.completedTodayTasks.map((task) => `- ${task.title}`).join("\n");
  const jira = formatJiraDayLines(day.context.jira);
  const prs = formatPrDayLines(day.context.prs);
  const persisted = day.persistedSummary?.trim() || "(resumo diário persistido não disponível)";

  return `### ${day.day}
Anotações:
${note}

Tarefas pendentes (snapshot):
${pending}

Tarefas concluídas no dia:
${completed}

Tickets Jira movimentados no dia:
${jira}

Pull requests e code review:
${prs}

Resumo diário persistido:
${persisted}`;
}

function formatWeeklyTotals(context: WeeklySummaryContext): string {
  const { totals } = context;
  return `Totais agregados da semana:
- Tickets concluídos: ${totals.jiraTicketsClosed}
- PRs mescladas: ${totals.prsMerged}
- Reviews realizados: ${totals.reviewsGiven}
- Reviews recebidos: ${totals.reviewsReceived}
- Tarefas concluídas: ${totals.tasksCompleted}
- Tickets Jira movimentados: ${totals.jiraTicketsMoved}
- Tickets Jira ainda abertos (movimentados): ${totals.jiraTicketsStillOpen}
- Dias com atividade: ${totals.activeDays}
- PRs abertas no fim da semana: ${totals.openPrsOnLastDay}`;
}

function formatDeltaLine(delta: WeeklyComparisonDelta): string {
  const sign = delta.delta > 0 ? `+${delta.delta}` : String(delta.delta);
  return `- ${delta.metric}: ${delta.current} (semana anterior: ${delta.previous}, delta: ${sign})`;
}

function formatComparisonDeltas(context: WeeklySummaryContext): string {
  if (context.comparisonDeltas.length === 0) {
    return "(métricas da semana anterior indisponíveis para comparação numérica — preencha a tabela com os totais desta semana e indique ausência de baseline)";
  }

  return context.comparisonDeltas.map(formatDeltaLine).join("\n");
}

function formatCarryOver(context: WeeklySummaryContext): string {
  if (context.carryOver.pendingTasks.length === 0) {
    return "(nenhuma tarefa pendente no fechamento da semana)";
  }

  return context.carryOver.pendingTasks
    .map((task) => {
      const overdue = task.isOverdue ? " (atrasada)" : "";
      return `- ${task.title}${overdue}`;
    })
    .join("\n");
}

function formatActivityByDay(context: WeeklySummaryContext): string {
  return context.activityByDay
    .map(({ day, score }) => `- ${day}: ${score} ponto(s) de atividade`)
    .join("\n");
}

function formatPreviousWeekSummary(context: WeeklySummaryContext): string {
  return context.previousWeekSummary?.trim() || "(resumo da semana anterior não disponível)";
}

export function buildWeeklySummaryPrompt(context: WeeklySummaryContext): string {
  const daySections = context.days.map(formatDaySnapshot).join("\n\n");

  return `Você é um assistente que produz resumos semanais em português do Brasil no formato **Bússola de Tendência**: consolidar os 7 dias, expor padrões repetitivos e dar contexto de evolução ao desenvolvedor e ao gestor.

${buildSummaryCareerPersona()}

Analise a semana de ${context.weekMonday} a ${context.weekSunday} com base nos dados abaixo.
Correlacione anotações, tarefas locais, tickets Jira (status/horas), pull requests e resumos diários persistidos quando disponíveis — **sintetize a semana inteira, não reproduza dia a dia na saída**.

${buildSummaryPromptGoldenRules("weekly")}

${buildWeeklySummaryOutputRules()}

${buildSummaryCareerRules("weekly")}

${buildSummaryCareerSections("weekly")}

Regras adicionais:
- Tom objetivo, construtivo e profissional — visão de fechamento com foco em padrões e evolução.
- Não invente fatos ausentes nos dados.
- Em "Balanço de Força", use os deltas numéricos fornecidos; se não houver baseline, mostre apenas os totais desta semana.
- Em "Grandes Marcos", priorize entregas com impacto no produto — não liste cada PR isolada.
- Em "Padrões Detectados", identifique comportamentos repetidos (bons e ruins) ao longo dos 7 dias.
- Em "O que Cruzou a Fronteira", inclua tarefas pendentes, tickets Jira em aberto, PRs paradas e alinhamentos do caderno.
- Cruze entregas locais com movimentação Jira e menções no caderno quando fizer sentido.
- Se a semana tiver poucos dados, diga isso claramente.

${formatWeeklyTotals(context)}

Deltas vs. semana anterior (use na tabela de Balanço de Força):
${formatComparisonDeltas(context)}

Carry-over (tarefas pendentes no fim da semana):
${formatCarryOver(context)}

Atividade por dia (referência interna — não listar dia a dia na saída):
${formatActivityByDay(context)}

Resumo da semana anterior (referência de continuidade — não copiar):
${formatPreviousWeekSummary(context)}

Detalhamento por dia (referência interna — sintetizar, não reproduzir):
${daySections}`;
}
