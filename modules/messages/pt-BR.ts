/** User-facing copy in pt-BR. Code identifiers stay English; import from here at UI/API edges. */

export const ptBR = {
  helpHint: {
    ariaLabel: "Mais informações"
  },
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
    widgetTitle: "Briefing do dia",
    widgetHelp:
      "Mapa de batalha do dia: fechamento de ontem, desbloqueios urgentes e foco de ataque. Atualizado automaticamente a cada hora.",
    refresh: "Atualizar",
    refreshAriaLabel: "Atualizar briefing",
    dayMeta: (day: string, previousBusinessDay: string | null) =>
      previousBusinessDay
        ? `Hoje: ${day} · Último dia útil: ${previousBusinessDay}`
        : `Hoje: ${day}`,
    waiting:
      "O briefing ainda não foi gerado nesta hora. A rotina automática roda a cada hora; você também pode forçar em Devtools → Crons (Dash — briefing).",
    loading: "Carregando briefing…",
    missingApiKeyHint:
      "Adicione GEMINI_API_KEY no .env e reinicie o app.",
    rateLimitLink: "Gerenciar limite no Google AI Studio",
    updatedAt: (when: string) =>
      `Atualizado em ${when} · próxima rotina em até 1 hora`,
    missingApiKey: "Configure GEMINI_API_KEY no .env para gerar o briefing do dash.",
    invalidDate: "Data inválida. Use o formato YYYY-MM-DD.",
    generationFailed: "Falha ao gerar briefing do dash."
  },
  tasksWidget: {
    widgetTitle: "Tarefas",
    widgetHelp: "Tarefas pessoais em aberto nesta instância local.",
    viewAll: "Ver todas",
    loading: "Carregando lista…",
    openCount: (count: number) => `${count} em aberto`,
    openWithOverdue: (open: number, overdue: number) =>
      `${open} em aberto · ${overdue} atrasada${overdue === 1 ? "" : "s"}`,
    empty: "Lista vazia por agora.",
    create: "Criar tarefa",
    retry: "Tentar novamente",
    listAriaLabel: "Tarefas em aberto",
    loadingAriaLabel: "Carregando tarefas",
    overdueBadge: "Atrasada",
    completeAriaLabel: (title: string) => `Concluir ${title}`,
    completeSuccess: (title: string) => `“${title}” concluída.`,
    completeError: "Não foi possível concluir a tarefa.",
    hiddenCount: (count: number) =>
      `+ ${count} ${count === 1 ? "tarefa" : "tarefas"} em`
  },
  quickNote: {
    title: "Nota rápida",
    description:
      "Sempre salva no caderno de hoje. A IA cria tarefas relacionadas quando o texto pede ação. Ctrl+Enter para salvar.",
    placeholder: "Digite sua nota rápida...",
    textAriaLabel: "Texto da nota rápida",
    savedJournal: "Salvo no caderno de hoje.",
    savedJournalFallback: "Salvo no caderno de hoje (IA indisponível).",
    savedWithTasks: (count: number) =>
      count === 1
        ? "Salvo no caderno e 1 tarefa criada."
        : `Salvo no caderno e ${count} tarefas criadas.`,
    saveError: "Não foi possível salvar a nota rápida."
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
    widgetHelp: "Compromissos de hoje do Google Calendar (feed iCal secreto).",
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
    widgetHelp: "Acesso rápido às ferramentas que você mais usa.",
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
  localReview: {
    summary: (count: number) =>
      count === 1 ? "Revisão local · 1 achado" : `Revisão local · ${count} achados`,
    running: "Revisão local em andamento",
    runningDetail: (started: string, elapsed: string) => `Começou às ${started} · há ${elapsed}`,
    queueRunning: (repository: string, prNumber: number) => `Revisando ${repository} #${prNumber}`,
    finished: (repository: string, prNumber: number, count: number) =>
      count === 1
        ? `Revisão de ${repository} #${prNumber} concluída · 1 achado`
        : `Revisão de ${repository} #${prNumber} concluída · ${count} achados`,
    finishedFailed: (repository: string, prNumber: number) =>
      `Revisão de ${repository} #${prNumber} terminou com falha`,
    cronRunning: "Pode levar vários minutos. O andamento e o término aparecem em Para revisar.",
    failed: "A última revisão local falhou",
    interrupted: "A revisão foi interrompida antes de terminar.",
    human: "A IA sugere. Você decide. Nada é aprovado nem rejeitado no GitHub.",
    queueHint: "Revise uma PR da fila agora, ou espere a próxima da cron. O andamento fica neste card.",
    modelTitle: "Modelo da revisão",
    modelDescription: "Vale para o orquestrador e para os subagentes.",
    modelHaiku: "Haiku",
    modelHaikuHint: "Mais barato. É o padrão da cron.",
    modelSonnet: "Sonnet",
    modelSonnetHint: "Mais capaz e gasta mais da cota.",
    modelOpus: "Opus",
    modelOpusHint: "O mais capaz. Use pouco.",
    modelStart: "Começar revisão",
    modelCancel: "Cancelar",
    usageHeading: "Uso",
    usageScope: "Orquestrador e subagentes",
    usageChosen: (model: string) => `Modelo escolhido: ${model}`,
    usageOrchestrator: "Orquestrador",
    usageSubagents: "Subagentes",
    usagePeakOrchestrator: (peak: string, window: string, percent: number) =>
      `Pico da janela do orquestrador ${peak} de ${window} (${percent}%)`,
    usagePeakSubagents: (peak: string, window: string, percent: number) =>
      `Pico da janela dos subagentes ${peak} de ${window} (${percent}%)`,
    usageInput: "Entrada",
    usageOutput: "Saída",
    usageCacheRead: "Cache lido",
    usageCacheCreate: "Cache criado",
    usageThinking: "Thinking",
    usagePeak: (peak: string, window: string, percent: number) =>
      `Pico da janela ${peak} de ${window} (${percent}%)`,
    usageWindow: (window: string) => `Janela de ${window}`,
    usageWindowUnknown: "O tamanho da janela não veio no resultado.",
    usageCost: (amount: string) => `Estimativa de lista ${amount}.`,
    usageCostNote: "A assinatura não cobra este valor por chamada.",
    trigger: "Revisar agora",
    retry: "Tentar de novo",
    again: "Revisar de novo",
    started: (repository: string, prNumber: number) => `Revisão de ${repository} #${prNumber} começou.`,
    busyOther: (repository: string, prNumber: number) =>
      `Já existe uma revisão em andamento em ${repository} #${prNumber}.`,
    already: "Esta revisão já está em andamento.",
    missing: "Essa PR não está entre as suas PRs abertas nem na fila para revisar.",
    closed: "Essa PR não está mais aberta.",
    triggerFailed: "Não foi possível começar a revisão.",
    clean: "Nenhum achado acima do limiar de confiança.",
    read: "Ler revisão",
    openOnGitHub: "Abrir no GitHub",
    missingPage: "Não há revisão local desta PR.",
    summaryHeading: "Resumo",
    findingsHeading: "Achados",
    notCommentedHeading: "O que não foi comentado",
    traceabilityHeading: "Entrega",
    metaHeading: "Meta-revisão",
    docsHeading: "Documentos lidos",
    droppedNone: "Nenhum achado descartado.",
    droppedHeading: "Descartados",
    confidence: (percent: number) => `${percent}% de confiança`,
    agentsHeading: "Subagentes",
    agentEmpty: "Nada acima do limiar.",
    noteLabel: "Parecer",
    agents: {
      correctness: "Correção",
      security: "Segurança",
      contracts: "Contratos",
      tests: "Testes",
      delivery: "Requisitos",
      conventions: "Convenções",
      "second-pass": "Segunda leitura",
      "meta-review": "Meta-revisão"
    },
    agentDescriptions: {
      correctness: "Lógica e bugs no diff.",
      security: "Segurança, dados e permissões.",
      contracts: "Contratos, tipos e assinaturas.",
      tests: "Testes e o que ficou sem cobertura.",
      delivery: "Jira, spec e o que a PR prometeu entregar.",
      conventions: "Regras escritas do repositório.",
      "second-pass": "Relê o diff e justifica o que ficou sem comentário.",
      "meta-review": "Confere o código e derruba achado que não existe."
    },
    traceStatus: {
      met: "Atendido",
      unmet: "Não atendido",
      unclear: "Incerto"
    }
  },
  journalDayDraft: {
    action: "Gerar anotações",
    actionAriaLabel: "Gerar anotações do dia",
    pending: "Gerando…",
    pendingAriaLabel: "Gerando anotações do dia",
    failed: "Não foi possível gerar as anotações do dia.",
    missingApiKey: "Configure GEMINI_API_KEY no .env para gerar as anotações do dia.",
    invalidDate: "Data inválida. Use o formato YYYY-MM-DD.",
    invalidJson: "JSON inválido.",
    noInput:
      "Não há anotação, tarefa concluída, ticket Jira movimentado nem atividade de PR neste dia para montar as anotações."
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
    openToday: "Abrir hoje",
    openTodayAriaLabel: "Abrir journal de hoje",
    openJournal: "Abrir",
    openJournalAriaLabel: "Abrir journal",
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
