import type { PersistedDailySummaryContext } from "@/modules/summaries/lib/persisted-daily-context";
import { buildDailySummaryPrompt } from "@/modules/notebook-day";

export function buildPersistedDailySummaryPrompt(context: PersistedDailySummaryContext): string {
  const basePrompt = buildDailySummaryPrompt(context);
  const previousSection = context.previousDaySummary?.trim()
    ? context.previousDaySummary.trim()
    : "(nenhum resumo diário persistido para o dia anterior)";

  return `${basePrompt}

## Resumo do dia anterior (persistido)
${previousSection}

Inclua continuidade com o dia anterior quando o resumo anterior trouxer contexto relevante — preferencialmente em "Próximos Passos" ou "Mentalidade Sênior", sem repetir blocos inteiros.`;
}
