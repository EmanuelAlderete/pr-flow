import { formatDailySummaryContextData } from "@/modules/notebook-day";
import type { DashboardBriefingContext } from "@/modules/dashboard/lib/dashboard-briefing-types";
import { notebookDayToDate } from "@/modules/journal/lib/notebook-day";
import {
  buildDashboardBriefingOutputRules,
  buildSummaryPromptGoldenRules
} from "@/modules/summaries/lib/summary-career-coaching";

function formatPersistedDailySection(content: string | null): string {
  return content?.trim()
    ? content.trim()
    : "(resumo diário persistido do último dia útil não disponível)";
}

export function buildDashboardBriefingPrompt(context: DashboardBriefingContext): string {
  const { today, previousBusinessDay } = context;
  const isMonday = notebookDayToDate(today).getDay() === 1;

  const mondayNote = isMonday
    ? `\nHoje é segunda-feira (${today}). O "último dia útil" é ${previousBusinessDay} (sexta) — não use sábado nem domingo como referência de entregas.\n`
    : "";

  return `Você é um assistente que produz briefings operacionais em português do Brasil para o dashboard de trabalho de um desenvolvedor.

Objetivo: **mapa de batalha imediato**. O desenvolvedor bate o olho no widget às 09:00 e sabe exatamente o que fazer. Sem coaching, sem tapinha nas costas, sem motivação genérica — apenas execução.
${mondayNote}
${buildSummaryPromptGoldenRules("dashboard")}

${buildDashboardBriefingOutputRules()}

## Regras gerais
- Tom objetivo e direto — verbos imperativos nas ações.
- Não invente fatos ausentes nos dados.
- Se faltar informação em um ticket, diga de forma breve.
- Correlacione Jira, tarefas locais, PRs e anotações quando houver vínculo (ex.: JOR-123).
- Priorize bloqueios que travam a esteira (PRs paradas, comentários sem resposta, dependências front/back).

## Estrutura obrigatória (markdown, títulos exatamente assim)

**Status Geral:** (uma linha — o tom do dia: fechamento, destrave ou execução)

## 🏁 Fechamento de Ontem
(O que foi finalizado no último dia útil ${previousBusinessDay}: tickets concluídos, PRs mergeadas, entregas relevantes. Bullet points curtos; conte entregas em vez de listar cada evento.)

## 🚨 Desbloqueios Urgentes (Olhar Agora)
(PRs paradas, comentários sem resposta, tarefas locais esquecidas, comunicação pendente. Verbos imperativos: Cobre, Feche, Responda, Dispare.)

## 🎯 Foco de Ataque de Hoje
(Prioridade número 1 para ${today} com base em estimativas Jira, PRs bloqueadas e fila de review. Lista numerada curta — máximo 3 itens.)

---

# Dados do último dia útil (${previousBusinessDay})

${formatDailySummaryContextData(context.lastWorkdayContext)}

## Resumo diário persistido (${previousBusinessDay})
${formatPersistedDailySection(context.persistedDailySummaryForLastWorkday)}

---

# Dados de hoje (${today}) — para foco de ataque

${formatDailySummaryContextData(context.todayContext)}
`;
}
