import type {
  DailySummaryContext,
  DailySummaryJiraItem,
  DailySummaryPrItem,
  DailySummaryPrContext,
  DailySummaryPrMergedItem,
  DailySummaryPrStatusChange,
  DailySummaryQueueItem,
  DailySummaryReviewEvent,
  DailySummaryReviewItem
} from "@/modules/notebook-day/lib/types";
import {
  buildDailySummaryOutputRules,
  buildSummaryCareerPersona,
  buildSummaryCareerRules,
  buildSummaryCareerSections
} from "@/modules/summaries/lib/summary-career-coaching";

function formatTaskList(tasks: DailySummaryContext["pendingTasks"], includeOverdue: boolean): string {
  if (tasks.length === 0) {
    return "(nenhuma)";
  }

  return tasks
    .map((task, index) => {
      const parts = [`${index + 1}. ${task.title}`];
      if (task.description) {
        parts.push(`   Descrição: ${task.description}`);
      }
      if (task.dueDate) {
        parts.push(`   Prazo: ${task.dueDate}`);
      }
      if (includeOverdue && task.isOverdue) {
        parts.push("   Status: atrasada");
      }
      return parts.join("\n");
    })
    .join("\n");
}

function formatJiraIssue(issue: DailySummaryJiraItem): string {
  const parts = [
    `- ${issue.key}: ${issue.summary}`,
    `  Status: ${issue.statusName} (${issue.statusCategoryKey})`,
    `  Tipo: ${issue.issueTypeName}`
  ];

  if (issue.priorityName) {
    parts.push(`  Prioridade: ${issue.priorityName}`);
  }

  if (issue.hours) {
    parts.push(`  Tempo: ${issue.hours}`);
  } else if (issue.timeSpentLabel || issue.estimateLabel) {
    const timeParts: string[] = [];
    if (issue.estimateLabel) {
      timeParts.push(`estimativa ${issue.estimateLabel}`);
    }
    if (issue.timeSpentLabel) {
      timeParts.push(`gasto ${issue.timeSpentLabel}`);
    }
    if (issue.percentSpent != null) {
      timeParts.push(`${Math.round(issue.percentSpent)}% da estimativa`);
    }
    parts.push(`  Tempo: ${timeParts.join(" · ")}`);
  }

  parts.push(`  Atualizado: ${issue.updated}${issue.updatedOnDay ? " (movimentado neste dia)" : ""}`);

  return parts.join("\n");
}

function formatJiraSection(jira: DailySummaryContext["jira"]): string {
  if (!jira) {
    return "(integração Jira não configurada ou cache ainda não sincronizado)";
  }

  if (jira.issues.length === 0) {
    const label = jira.sprintLabel ? `filtro: ${jira.sprintLabel}` : "filtro padrão";
    return `(nenhum ticket atribuído no ${label})`;
  }

  const header = jira.sprintLabel ? `Contexto: ${jira.sprintLabel}\n\n` : "";
  const updatedToday = jira.issues.filter((issue) => issue.updatedOnDay);
  const other = jira.issues.filter((issue) => !issue.updatedOnDay);

  const sections: string[] = [header.trim()].filter(Boolean);

  if (updatedToday.length > 0) {
    sections.push(
      "### Movimentados neste dia",
      updatedToday.map(formatJiraIssue).join("\n")
    );
  } else {
    sections.push("### Movimentados neste dia", "(nenhum ticket com atualização neste dia civil)");
  }

  if (other.length > 0) {
    sections.push("### Demais tickets no filtro (contexto)", other.map(formatJiraIssue).join("\n"));
  }

  return sections.join("\n\n");
}

function prStatusLabel(status: DailySummaryPrItem["statusGeral"]): string {
  if (status === "approved") {
    return "Aprovada";
  }
  if (status === "changes_requested") {
    return "Alterações solicitadas";
  }
  if (status === "pending_review") {
    return "Revisão pendente";
  }
  return "Sem reviewers";
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
  if (state === "DISMISSED") {
    return "Review dispensado";
  }
  return state;
}

function formatLocalTime(iso: string): string {
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) {
    return iso;
  }
  return parsed.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

function formatOpenPr(pr: DailySummaryPrItem): string {
  const parts = [
    `- #${pr.number} (${pr.repository}): ${pr.title}`,
    `  Status: ${prStatusLabel(pr.statusGeral)}${pr.readyToMerge ? " · pronta para merge" : ""}`
  ];

  if (pr.jiraIssueKey) {
    parts.push(`  Ticket Jira: ${pr.jiraIssueKey}`);
  }
  if (pr.aprovou.length > 0) {
    parts.push(`  Aprovaram: ${pr.aprovou.join(", ")}`);
  }
  if (pr.solicitouAlteracoes.length > 0) {
    parts.push(`  Alterações solicitadas por: ${pr.solicitouAlteracoes.join(", ")}`);
  }
  if (pr.pendente.length > 0) {
    parts.push(`  Revisão pendente de: ${pr.pendente.join(", ")}`);
  }
  if (pr.impediments.length > 0) {
    parts.push(`  Impedimentos: ${pr.impediments.join(", ")}`);
  }
  if (pr.statusChangedOnDay) {
    parts.push("  Movimentação: status alterado neste dia");
  }

  return parts.join("\n");
}

function formatReviewGiven(review: DailySummaryReviewItem): string {
  const jira = review.jiraIssueKey ? ` · ${review.jiraIssueKey}` : "";
  return `- #${review.prNumber} (${review.repository}): ${review.prTitle}${jira} — ${reviewStateLabel(review.state)} às ${formatLocalTime(review.submittedAt)}`;
}

function formatReviewReceived(review: DailySummaryReviewEvent): string {
  const jira = review.jiraIssueKey ? ` · ${review.jiraIssueKey}` : "";
  return `- #${review.prNumber} (${review.repository}): ${review.prTitle}${jira} — ${review.reviewerLogin} ${reviewStateLabel(review.state).toLowerCase()} às ${formatLocalTime(review.submittedAt)}`;
}

function formatStatusChange(change: DailySummaryPrStatusChange): string {
  const jira = change.jiraIssueKey ? ` · ${change.jiraIssueKey}` : "";
  return `- #${change.prNumber} (${change.repository}): ${change.prTitle}${jira} — ${prStatusLabel(change.previousStatus)} → ${prStatusLabel(change.nextStatus)} (detectado às ${formatLocalTime(change.occurredAt)})`;
}

function formatMergedPr(merged: DailySummaryPrMergedItem): string {
  const jira = merged.jiraIssueKey ? ` · ${merged.jiraIssueKey}` : "";
  return `- #${merged.prNumber} (${merged.repository}): ${merged.prTitle}${jira} — merge/fechamento detectado às ${formatLocalTime(merged.occurredAt)}`;
}

function formatPendingReview(pr: DailySummaryQueueItem): string {
  const jira = pr.jiraIssueKey ? ` · ${pr.jiraIssueKey}` : "";
  return `- #${pr.number} (${pr.repository}): ${pr.title}${jira}`;
}

function formatPrSection(prs: DailySummaryPrContext | null): string {
  if (!prs) {
    return "(integração GitHub não configurada ou cache de PRs ainda não sincronizado)";
  }

  const sections: string[] = [];
  const syncNote = prs.syncedAt
    ? `Eventos derivados da timeline de sync (último snapshot: ${prs.syncedAt}).`
    : "";

  if (prs.myOpenPrs.length === 0) {
    sections.push("### Minhas PRs abertas", "(nenhuma PR aberta no monitor)");
  } else {
    sections.push(
      `### Minhas PRs abertas (${prs.myOpenPrs.length})`,
      prs.myOpenPrs.map(formatOpenPr).join("\n")
    );
  }

  if (prs.reviewsGivenToday.length === 0) {
    sections.push("### Reviews que você fez neste dia", "(nenhum review enviado neste dia civil)");
  } else {
    sections.push(
      `### Reviews que você fez neste dia (${prs.reviewsGivenToday.length})`,
      prs.reviewsGivenToday.map(formatReviewGiven).join("\n")
    );
  }

  if (prs.reviewsReceivedToday.length === 0) {
    sections.push("### Reviews recebidos nas suas PRs neste dia", "(nenhum review recebido neste dia civil)");
  } else {
    sections.push(
      `### Reviews recebidos nas suas PRs neste dia (${prs.reviewsReceivedToday.length})`,
      prs.reviewsReceivedToday.map(formatReviewReceived).join("\n")
    );
  }

  if (prs.statusChangesToday.length === 0) {
    sections.push("### Mudanças de status nas suas PRs", "(nenhuma mudança de status registrada neste dia)");
  } else {
    sections.push(
      `### Mudanças de status nas suas PRs (${prs.statusChangesToday.length})`,
      prs.statusChangesToday.map(formatStatusChange).join("\n")
    );
  }

  if (prs.mergesToday.length === 0) {
    sections.push("### PRs mergeadas ou fechadas", "(nenhuma PR sua saiu do monitor por merge/fechamento neste dia)");
  } else {
    sections.push(
      `### PRs mergeadas ou fechadas (${prs.mergesToday.length})`,
      prs.mergesToday.map(formatMergedPr).join("\n")
    );
  }

  if (prs.pendingReviews.length === 0) {
    sections.push("### Fila de revisão pendente", "(nenhuma PR aguardando seu review)");
  } else {
    sections.push(
      `### Fila de revisão pendente (${prs.pendingReviews.length})`,
      prs.pendingReviews.map(formatPendingReview).join("\n")
    );
  }

  if (syncNote) {
    sections.push(syncNote);
  }

  return sections.join("\n\n");
}

export function formatDailySummaryContextData(context: DailySummaryContext): string {
  const noteSection = context.noteBody?.trim()
    ? context.noteBody.trim()
    : "(nenhuma anotação registrada para o dia)";

  return `Data: ${context.day}

## Anotações do dia
${noteSection}

## Tarefas pendentes (locais)
${formatTaskList(context.pendingTasks, true)}

## Tarefas concluídas hoje (locais)
${formatTaskList(context.completedTodayTasks, false)}

## Tickets Jira atribuídos
${formatJiraSection(context.jira)}

## Pull Requests
${formatPrSection(context.prs)}`;
}

export function buildDailySummaryPrompt(context: DailySummaryContext): string {
  return `Você é um assistente que produz resumos diários em português do Brasil no formato **Feedback 3x3**: impacto, ação e evolução profissional — não um relatório cronológico de eventos.

${buildSummaryCareerPersona()}

Com base exclusivamente nos dados abaixo, escreva um resumo do dia **correlacionando** anotações do caderno, tarefas locais, tickets Jira (status e horas) e pull requests (suas PRs, reviews e fila pendente). A correlação alimenta a síntese nas três seções — não reproduza cada fonte em bloco separado.

## Regras gerais
- Tom objetivo, construtivo e profissional.
- Não invente fatos ausentes nos dados.
- Se os dados forem escassos, diga isso de forma clara.

${buildDailySummaryOutputRules()}

${buildSummaryCareerRules("daily")}

## Correlação entre fontes (use internamente; sintetize na saída)
- Identifique quando tarefa local, anotação ou PR referem-se a um ticket Jira (código no texto, título semelhante ou mesmo tema).
- Agrupe entregas relacionadas (ex.: tarefa concluída + ticket em "Concluído" + PR mergeada + menção nas anotações) em um único insight de impacto.
- Detecte inconsistências úteis para "Próximos Passos" ou "Mentalidade Sênior" (ex.: merge com comentários pendentes, anotação menciona bloqueio mas ticket segue em progresso, front mergeado sem back).
- Use horas e status do Jira para quantificar esforço quando disponível; não extrapole worklog diário — os tempos são acumulados do ticket.
- Cruze reviews recebidos/dados, status de PR e fila pendente para identificar gargalos e comportamentos de processo.

${buildSummaryCareerSections("daily")}

${formatDailySummaryContextData(context)}
`;
}
