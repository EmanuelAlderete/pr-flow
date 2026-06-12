import type { WorkContextGap, WorkContextGapInput } from "@/modules/work-context/lib/domain";

function isJiraDone(statusCategoryKey: string | null): boolean {
  return statusCategoryKey === "done";
}

function isJiraInProgress(statusCategoryKey: string | null): boolean {
  return statusCategoryKey === "indeterminate";
}

function isJiraOpen(statusCategoryKey: string | null): boolean {
  return statusCategoryKey === "new" || statusCategoryKey === "indeterminate";
}

export function detectWorkContextGaps(input: WorkContextGapInput): WorkContextGap[] {
  const gaps: WorkContextGap[] = [];
  const hasOpenPr = input.openPullRequests.length > 0;
  const hasOpenTask = input.tasks.some((task) => !task.completed);
  const hasCompletedTask = input.tasks.some((task) => task.completed);
  const hasJournalMention = input.journalMentions.length > 0;
  const hasLinkedActivity = hasOpenPr || hasOpenTask || hasJournalMention;

  if (hasOpenPr && isJiraDone(input.jiraStatusCategoryKey)) {
    gaps.push({
      kind: "open_pr_ticket_done",
      severity: "warning",
      message:
        "Há pull request aberta vinculada a este ticket, mas o Jira está marcado como concluído. Vale revisar se falta merge ou atualizar o ticket."
    });
  }

  if (isJiraInProgress(input.jiraStatusCategoryKey) && !hasLinkedActivity) {
    gaps.push({
      kind: "ticket_in_progress_no_activity",
      severity: "info",
      message:
        "Ticket em progresso no Jira, sem PR aberta, task pendente ou menção recente no journal. Considere registrar o que está em andamento."
    });
  }

  if (hasCompletedTask && isJiraOpen(input.jiraStatusCategoryKey)) {
    gaps.push({
      kind: "task_done_ticket_open",
      severity: "warning",
      message:
        "Há task local concluída, mas o ticket no Jira ainda aparece aberto. Atualize o status no Jira ou reabra a task se o trabalho não terminou."
    });
  }

  return gaps;
}
