# Contexto de domínio — PR Flow

Vocabulário compartilhado para humanos e agentes. Comportamento real está no código; este arquivo descreve **conceitos** e onde vivem.

## Notebook day

Dia de trabalho local (`YYYY-MM-DD`), alinhado ao fuso do usuário. Agrupa anotação (journal), tarefas concluídas naquele dia, atividade Jira e PR. Usado para montar contexto de IA — módulo **`modules/notebook-day/`** (`buildNotebookDayContext`, `contextHasSummaryInput`, `buildDailySummaryPrompt`). Re-exports legados em `modules/dashboard/lib/daily-summary-*.ts` (não confundir com briefing).

## Três artefatos de texto com IA

| Artefato (UI pt-BR) | Rota | Tipo Postgres | Cron (código EN) |
|----------|----------|------------------|------------|
| **Resumo diário** | `/summaries` | `daily` | `cron:summaries-daily` (meia-noite) |
| **Resumo semanal** | `/summaries` | `weekly` | `cron:summaries-weekly` |
| **Briefing do dashboard** | `/dashboard` (widget) | `dashboard` | `cron:dashboard-briefing` (horária) |

- **Resumo diário / semanal:** persistidos em `summaries`, gerados a partir do notebook day; fluxo em `modules/summaries/`. Rota legada `/resumos` redireciona para `/summaries`. Formatos de saída: diário **Feedback 3x3** (impacto, ação, evolução); semanal **Bússola de Tendência** (balanço de força com deltas, marcos, padrões, carry-over).
- **Briefing:** mapa de batalha imediato do hub (fechamento do último dia útil, desbloqueios urgentes, foco de ataque — sem coaching). Leitura: `GET /api/dashboard/briefing` (rota legada `/api/dashboard/daily-summary` delega ao mesmo handler). UI: `DashboardBriefingWidget`, hook `useDashboardBriefing`. Serviço: `dashboard-briefing-service.ts`.

Arquivos `daily-summary-*` no dashboard são re-exports finos para compatibilidade; a implementação vive em `notebook-day`.

## Geração por LLM

Seam compartilhado em **`modules/llm-generation/`**: interface `LlmTextGenerator` (prompt → texto), adapter Gemini (`createGeminiLlmGenerator`), adapter em memória para testes. Consumidores: `summary-generation-service`, `dashboard-briefing-service`. Entrada: `generateLlmText` / `hasLlmApiKey` (gerador padrão substituível com `setDefaultLlmGenerator`).

## Chave de issue Jira (JOR-xxx)

Módulo **`modules/jira-issue-key/`** (helpers puros, seguro em Client Components): extração de chave em títulos/textos, `normalizeJiraIssueKey`, URLs de browse e rota interna `/jira?issue=…`, linkify em markdown. Seam server-only em **`modules/jira-issue-key/server`**: `JiraIssueKeySource`, `createPrMonitorCacheIssueKeySource` (cache PR). `syncJiraCache({ issueKeySource })` aceita fonte injetável em testes. Re-export legado: `prs/lib/core/jira-issue.ts`.

## PR monitor cache

Cache Postgres das PRs monitoradas; atualizado por cron e `POST /api/prs`. Leitura via `GET /api/prs`. Domínio: `modules/prs/`. Keys Jira nos títulos alimentam o sync Jira via `jira-issue-key`.

## Descoberta de branches (abrir PR)

Módulo **`modules/prs/lib/open-pr/open-pr-branch-discovery.ts`**: interface `discoverOpenPrBranches(repository)` — lista branches do autor autenticado via GitHub GraphQL (`gh-open-pr-client.ts`) e enriquece títulos com key Jira extraída do nome da branch. Cache em memória 5 min (`open-pr-branch-cache.ts`). UI pré-carrega branches ao selecionar repositório; branch manual se a lista falhar.

## Agendamento de crons

Módulo **`modules/cron-scheduling/`**: specs (`CRON_JOB_SCHEDULE_SPECS`), `startAllCrons()` na subida do servidor, `registerScheduledCrons` testável com scheduler fake. Execução de domínio continua em `modules/devtools/lib/cron-job-runners.ts`.

## Flags de cron relacionadas

| Variável | Jobs afetados |
|----------|----------------|
| `DISABLE_PR_SYNC_CRON=1` | `cron:prs-sync` |
| `DISABLE_JIRA_SYNC_CRON=1` | `cron:jira-sync` |
| `DISABLE_SUMMARY_CRON=1` | `cron:summaries-daily`, `cron:summaries-weekly` |
| `DISABLE_DASHBOARD_BRIEFING_CRON=1` | `cron:dashboard-briefing` |

`SUMMARY_CRON_TZ` — fuso dos jobs de resumo e briefing (padrão `America/Sao_Paulo`).

## Nomes no código (EN) vs domínio (pt-BR)

| Domínio (docs/UI) | Código |
|-------------------|--------|
| Resumo diário / semanal | `modules/summaries/`, `/summaries`, `SummaryType` |
| Briefing do dashboard | `dashboard-briefing-*`, `cron:dashboard-briefing` |
| Notebook day | `modules/notebook-day/` |
| Tarefa / nota (journal) | `modules/tasks/`, `modules/journal/` |

## System log

Evento estruturado emitido pela aplicação (crons, sync, boot) via instrumentação interna. Destino: stdout coletado pela stack de observabilidade — não é feature de UI nem dado de produto no Postgres.
_Avoid_: log do Devtools, persistência de logs no Postgres

Campo **`source`** em duas camadas:

| Camada | Padrão | Exemplos | Quem emite |
|--------|--------|----------|------------|
| Orquestração | `cron:*`, `api:*` | `cron:jira-sync`, `api:prs-sync` | runners de cron, rotas HTTP |
| Domínio | `<módulo>:<ação>` | `jira:sync`, `prs:sync`, `open-pr:create` | serviços de domínio |

Serviços logam detalhes internos sem saber o gatilho (manual, cron ou API). Orquestradores logam início/fim do fluxo que dispararam.

## Observabilidade

Capacidade de inspecionar saúde e comportamento do PR Flow fora da aplicação: logs, métricas e dashboards em ferramentas dedicadas (ex.: Grafana), via Docker Compose local (`docker compose up`). `npm run dev` fora do Compose não alimenta Loki.
_Avoid_: página de logs no app, histórico de logs no banco de produto

## Gh command log

Registro em arquivo dos comandos `gh` executados pelo monitor de PRs (`GhLogger`). Independente de system logs e da stack de observabilidade.
_Avoid_: system log, log do Loki

## Documentação operacional

- `AGENTS.md` — rotas, stack, convenções
- `docs/architecture-deepening-opportunities.md` — oportunidades de refactor
