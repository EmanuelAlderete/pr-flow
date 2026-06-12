/** User-facing copy in pt-BR. Code identifiers stay English; import from here at UI/API edges. */

export const ptBR = {
  summary: {
    missingApiKey: "Configure GEMINI_API_KEY no .env para gerar resumos.",
    invalidDate: "Data inválida. Use o formato YYYY-MM-DD.",
    invalidWeekMonday: "Semana inválida. Use segunda-feira no formato YYYY-MM-DD.",
    generationFailed: "Falha ao gerar resumo.",
    dailyAlreadyExists: (day: string) => `Resumo diário de ${day} já existe.`,
    weeklyAlreadyExists: (weekMonday: string) => `Resumo semanal de ${weekMonday} já existe.`,
    dailyNoInput:
      "Não há anotações, tarefas concluídas, tickets Jira movimentados nem atividade de PR (review, merge ou mudança de status) neste dia — resumo não gerado para economizar cota da API.",
    weeklyNoInput:
      "Não há anotações, tarefas concluídas, atividade Jira nem PR/review na semana — resumo semanal não gerado.",
    loadFailed: "Falha ao carregar resumos.",
    loadHistoryFailed: "Não foi possível carregar o histórico de resumos.",
    listFailed: "Falha ao listar resumos."
  },
  briefing: {
    missingApiKey: "Configure GEMINI_API_KEY no .env para gerar o briefing do dash.",
    invalidDate: "Data inválida. Use o formato YYYY-MM-DD.",
    generationFailed: "Falha ao gerar briefing do dash."
  },
  gemini: {
    rateLimit:
      "O limite de uso da API Gemini foi atingido (cota mensal ou muitas requisições). Os resumos automáticos das crons voltarão quando a cota for liberada. Para ajustar o limite, acesse o Google AI Studio."
  },
  cron: {
    manualConfirmation: "Confirmo execução manual deste cron no PR Flow.",
    bootCatchupCheck: "Boot: verificando resumos pendentes no banco."
  }
} as const;

export const DAILY_SUMMARY_NO_INPUT_MESSAGE = ptBR.summary.dailyNoInput;
export const WEEKLY_SUMMARY_NO_INPUT_MESSAGE = ptBR.summary.weeklyNoInput;
export const GEMINI_RATE_LIMIT_USER_MESSAGE = ptBR.gemini.rateLimit;
export const CRON_MANUAL_CONFIRMATION_PHRASE = ptBR.cron.manualConfirmation;
