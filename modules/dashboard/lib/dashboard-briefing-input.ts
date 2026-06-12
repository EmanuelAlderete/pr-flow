import type { DashboardBriefingContext } from "@/modules/dashboard/lib/dashboard-briefing-types";
import { contextHasSummaryInput } from "@/modules/notebook-day";

export const DASHBOARD_BRIEFING_NO_INPUT_MESSAGE =
  "Não há tickets Jira, tarefas, anotações nem atividade de PR suficientes para gerar o briefing do dash — aguardando dados ou sincronização.";

function contextHasWorkItems(context: DashboardBriefingContext["todayContext"]): boolean {
  return (
    context.pendingTasks.length > 0 ||
    (context.jira?.issues.length ?? 0) > 0 ||
    (context.prs?.myOpenPrs.length ?? 0) > 0 ||
    (context.prs?.pendingReviews.length ?? 0) > 0
  );
}

export function dashboardBriefingHasInput(context: DashboardBriefingContext): boolean {
  return (
    contextHasSummaryInput(context.lastWorkdayContext) ||
    contextHasSummaryInput(context.todayContext) ||
    contextHasWorkItems(context.todayContext) ||
    contextHasWorkItems(context.lastWorkdayContext) ||
    Boolean(context.persistedDailySummaryForLastWorkday?.trim())
  );
}
