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
      "O limite de uso da API Gemini foi atingido (cota mensal ou muitas requisições). Os resumos automáticos das crons voltarão quando a cota for liberada. Para ajustar o limite, acesse o Google AI Studio.",
    unavailable:
      "Os modelos de IA estão temporariamente indisponíveis (alta demanda no Google). O app já tentou modelos alternativos automaticamente — aguarde alguns minutos e tente novamente."
  },
  jiraBranch: {
    missingApiKeyHint: "IA indisponível — informe o slug manualmente.",
    createSuccess: "Branch criada no GitHub.",
    createPartial: (count: number) => `Branch criada em ${count} repositório(s).`,
    createNone: "Nenhuma branch nova foi criada."
  },
  cron: {
    manualConfirmation: "Confirmo execução manual deste cron no PR Flow.",
    bootCatchupCheck: "Boot: verificando resumos pendentes no banco."
  },
  vacation: {
    setupTitle: "Quando começam as férias?",
    setupDescription:
      "Informe a data de início para acompanhar a contagem no dashboard e na barra lateral.",
    editTitle: "Alterar data das férias",
    editDescription: "A contagem usa o dia de início das férias no fuso local.",
    dateLabel: "Data de início",
    datePlaceholder: "Selecionar data",
    save: "Salvar",
    skip: "Configurar depois",
    cancel: "Cancelar",
    configure: "Configurar",
    edit: "Alterar",
    widgetTitle: "Férias",
    widgetEmpty: "Defina a data de início para ver a contagem regressiva.",
    sidebarEyebrow: "Férias",
    sidebarUnit: "dias",
    sidebarToday: "Hoje",
    sidebarOngoing: "Já!",
    today: "As férias começam hoje!",
    ongoing: "Você já está de férias.",
    daysRemaining: (days: number) =>
      days === 1 ? "Falta 1 dia para as férias." : `Faltam ${days} dias para as férias.`
  },
  dayCalendar: {
    widgetTitle: "Eventos do dia",
    widgetHint: (count: number) =>
      count === 1 ? "1 compromisso na agenda." : `${count} compromissos na agenda.`,
    widgetEmpty: "Nada na agenda para hoje.",
    widgetEmptyConfig: "Conecte o calendário pelo .env para ver os eventos.",
    noEvents: "Agenda livre por agora.",
    loading: "Carregando agenda…",
    listAriaLabel: "Eventos de hoje",
    retry: "Tentar novamente",
    missingConfig:
      "Configure GOOGLE_CALENDAR_ICAL_URL no .env com o endereço secreto do iCal do Google Calendar.",
    invalidDate: "Data inválida. Use o formato YYYY-MM-DD.",
    loadFailed: "Não foi possível carregar os eventos do calendário."
  },
  shortcutDeck: {
    widgetTitle: "Deck de atalhos",
    widgetEmpty: "Adicione links rápidos para ferramentas do dia a dia.",
    widgetHint: "Acesso rápido às ferramentas que você mais usa.",
    configure: "Configurar",
    manage: "Gerenciar",
    manageAriaLabel: "Gerenciar deck de atalhos",
    deckAriaLabel: "Atalhos configurados",
    listAriaLabel: "Lista de atalhos",
    manageTitle: "Deck de atalhos",
    manageDescription:
      "Configure links com ícone, cor e ordem. URLs externas abrem em nova aba.",
    emptyManage: "Nenhum atalho ainda. Adicione o primeiro.",
    addShortcut: "Adicionar atalho",
    addFormTitle: "Novo atalho",
    editFormTitle: "Editar atalho",
    labelField: "Nome",
    labelPlaceholder: "Ex.: Slack, Argo CD",
    urlField: "URL",
    urlPlaceholder: "https://… ou /rota-interna",
    iconField: "Ícone",
    colorField: "Cor",
    labelRequired: "Informe um nome.",
    urlInvalid: "Informe uma URL http(s) ou um caminho interno começando com /.",
    maxReached: (max: number) => `Limite de ${max} atalhos atingido.`,
    add: "Adicionar",
    save: "Salvar",
    cancel: "Cancelar",
    done: "Concluir",
    edit: "Editar atalho",
    remove: "Remover atalho",
    moveUp: "Mover para cima",
    moveDown: "Mover para baixo"
  },
  journalStreak: {
    widgetTitle: "Streak do journal",
    widgetEmpty: "Nenhum streak ainda — escreva no journal hoje.",
    streakLabel: (days: number) =>
      days === 1 ? "1 dia útil seguido" : `${days} dias úteis seguidos`,
    stripAriaLabel: "Dias úteis recentes com nota no journal",
    dayFilled: (day: string) => `${day}: com nota`,
    dayPending: (day: string) => `${day}: pendente`,
    dayEmpty: (day: string) => `${day}: sem nota`,
    openToday: "Abrir journal de hoje",
    openJournal: "Abrir journal",
    loading: "Carregando streak…",
    loadFailed: "Não foi possível carregar o streak do journal.",
    retry: "Tentar novamente",
    calendarHasNote: "Dia com nota"
  }
} as const;

export const DAILY_SUMMARY_NO_INPUT_MESSAGE = ptBR.summary.dailyNoInput;
export const WEEKLY_SUMMARY_NO_INPUT_MESSAGE = ptBR.summary.weeklyNoInput;
export const GEMINI_RATE_LIMIT_USER_MESSAGE = ptBR.gemini.rateLimit;
export const GEMINI_UNAVAILABLE_USER_MESSAGE = ptBR.gemini.unavailable;
export const CRON_MANUAL_CONFIRMATION_PHRASE = ptBR.cron.manualConfirmation;
