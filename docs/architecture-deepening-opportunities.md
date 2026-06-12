# Oportunidades de aprofundamento — PR Flow

Revisão de arquitetura (skill *improve-codebase-architecture*). Data: 2026-06-01.

Exploração focada em `modules/`, `app/api/`, `instrumentation.ts` e documentação existente. Não há `CONTEXT.md` nem ADRs no repositório; vocabulário de domínio vem de `AGENTS.md` e `README.md` (notebook day, PR monitor, resumos, briefing do dashboard, cache Jira/PR, crons).

O projeto já segue slices verticais (`modules/prs`, `jira`, `resumos`, etc.) com rotas finas — bom para navegação. A fricção principal está em **conceitos partidos entre módulos** e em **módulos rasos** que não concentram complexidade.

---

## 1. Contexto do dia de trabalho (notebook day) sem dono único — feito

**Feito (2026-06-01):** `modules/notebook-day/` concentra tipos, `buildNotebookDayContext`, contexto Jira/PR, `contextHasSummaryInput` / `dayHasSummaryInput`, prompt. Seam público: `tests/notebook-day.test.ts`. `dashboard/lib/daily-summary-*` e `resumos/lib/summary-input` (parte diária) são re-exports; briefing e resumos importam `@/modules/notebook-day`.

---

## 2. Cliente de IA (Gemini) acoplado ao dashboard — feito

**Feito (2026-06-01):** `modules/llm-generation/` concentra `LlmTextGenerator`, adapter Gemini (`createGeminiLlmGenerator`), adapter em memória (`createInMemoryLlmGenerator`), erros e `generateLlmText` / `hasLlmApiKey` via `getDefaultLlmGenerator` (substituível com `setDefaultLlmGenerator`). Seam: `tests/llm-generation.test.ts`. `dashboard-briefing-service` e `summary-generation-service` importam `@/modules/llm-generation`; `dashboard/lib/gemini-*` são re-exports deprecados.

---

## 3. `getDb()` e schema global dentro de `tasks`

**Arquivos:** `modules/db/lib/db.ts` (registra schemas de tasks, journal, prs, jira, resumos, app)

**Problema:** O ponto de entrada Postgres vive no módulo **Tasks**, mas 8+ repositórios de outros domínios importam `@/modules/tasks/lib/db`. A interface expõe detalhes de todos os schemas; qualquer novo domínio altera `tasks`. **Deletion test:** remover `tasks/lib/db.ts` espalharia `DATABASE_URL` + registro Drizzle em N repositórios — sinal de que o módulo não esconde complexidade no lugar certo, só a desloca para um nome errado.

**Solução:** Módulo `db` ou `persistence` na raiz de `modules/` (ou `lib/db`) — único dono de conexão e schema registry. `tasks` fica só com tarefas.

**Benefícios:** **Localidade** de migrations e tipagem Drizzle. Imports deixam de sugerir que Tasks “possui” o banco. Testes de integração podem substituir um adapter único em vez de acoplar a Tasks.

---

## 4. Orquestração de crons fragmentada — feito

**Feito (2026-06-01):** `modules/cron-scheduling/` concentra specs declarativos (`CRON_JOB_SCHEDULE_SPECS`), `registerScheduledCrons` (scheduler injetável), `startAllCrons()`. `instrumentation.ts` só chama `startAllCrons()`. Resumos usam `DISABLE_SUMMARY_CRON`; briefing usa `DISABLE_DASHBOARD_BRIEFING_CRON` (independente). Seam: `tests/cron-scheduling.test.ts`. `cron-job-definitions` espelha `disableEnvVar` das specs.

---

## 5. Sincronização Jira ↔ cache de PR sem seam explícito — feito

**Feito (2026-06-01):** `modules/jira-issue-key/` concentra `extractJiraIssueKey`, `normalizeJiraIssueKey`, URLs de browse/app, linkify markdown e seam `JiraIssueKeySource` (`collectJiraIssueKeysFromTexts`, `createPrMonitorCacheIssueKeySource`). `syncJiraCache` aceita `issueKeySource` injetável (padrão: adapter do cache PR). Seam: `tests/jira-issue-key.test.ts`, `tests/jira-sync-service.test.ts`. `prs/lib/core/jira-issue.ts` re-exporta (deprecado). Consumidores cross-domain importam `@/modules/jira-issue-key`.

---

## 6. `monitor-service.ts` — módulo raso (pass-through) — feito

**Feito (2026-06-01):** Removido `modules/prs/lib/monitor-service.ts`. Seam oficial do monitor: `getPrSyncData` + `toMonitorApiResponse` em `modules/prs/lib/pr-sync-data-service.ts` (mesmo caminho de `syncPrCache` / `POST /api/prs`). Testes: `tests/pr-sync-data-service.test.ts`.

---

## 7. Work context — agregação ampla sem profundidade — feito

**Feito (2026-06-01):** Queries filtradas por chave em `listActiveTasksMentioningIssueKey` e `listActiveNotesMentioningIssueKey` (regex Postgres + `textMentionsIssueKey` em `@/modules/jira-issue-key`). Loaders por fonte: `work-context-tasks`, `work-context-pull-requests`, `work-context-journal`. `buildWorkContext` é fachada fina. Seams: `tests/issue-key-text.test.ts`, `tests/task-repository-issue-key.test.ts`, `tests/note-repository-issue-key.test.ts`, `tests/work-context-*.test.ts`, `tests/build-work-context.test.ts`.

---

## 8. Nomenclatura “daily-summary” vs briefing (fricção cognitiva) — feito

**Feito (2026-06-01):** `GET /api/dashboard/briefing`, `DashboardBriefingWidget`, testids `dashboard-briefing-*`, `CONTEXT.md` com os três artefatos. Rota legada `/api/dashboard/daily-summary` delega ao briefing; cache `sessionStorage` migra de `pr-flow:dashboard-daily-summary-v1:` para `pr-flow:dashboard-briefing-v1:`. Arquivos `daily-summary-*` no dashboard permanecem como re-exports `@deprecated` do **notebook day** (insumo do briefing e dos resumos).

---

## Mapa de diretórios (referência)

```
application/
├── instrumentation.ts          # Registra crons no runtime Node
├── lib/                        # utils, init (gh)
├── app/                        # Rotas + API (delegadores finos)
├── components/                 # Shell + shadcn
└── modules/
    ├── app/                    # GitHub login (settings)
    ├── dashboard/              # Hub, briefing IA (consome notebook-day)
    ├── llm-generation/         # Geração de texto por LLM (Gemini + adapters)
    ├── notebook-day/           # Contexto do notebook day (insumo IA)
    ├── cron-scheduling/        # Agendamento node-cron (specs + startAllCrons)
    ├── devtools/               # Crons on-demand, definições, runners
    ├── jira-issue-key/         # Chave JOR-xxx, URLs, fontes para sync Jira
    ├── jira/                   # Sync, cache, UI
    ├── journal/                # Notas por notebook day
    ├── observability/          # system logs (stdout) + métricas Prometheus
    ├── notifications/          # Alertas browser
    ├── prs/                    # Maior módulo: GH, cache, timeline, UI
    ├── resumos/                # Resumos persistidos + schedulers
    ├── db/                       # Postgres + registry Drizzle (getDb)
    ├── tasks/                  # Tarefas
    └── work-context/           # Agregado cross-domain por issue Jira
```

## Fluxos principais (resumo)

- **PR monitor:** cron/`POST /api/prs` → GitHub → Postgres + timeline; `GET /api/prs` só lê cache.
- **Jira cache:** cron → API Jira (+ keys via `JiraIssueKeySource` / cache PR) → Postgres; leitura via `/api/jira/issues`.
- **IA:** context builders → prompts → `llm-generation` (Gemini) → `summaries` (`daily` | `weekly` | `dashboard`).
- **Crons:** `instrumentation.ts` → `startAllCrons()` → `cron-job-runners.ts` → serviços de domínio.

## Documentação relacionada

| Documento | Escopo |
|-----------|--------|
| `AGENTS.md` | Rotas, stack, convenções, env de crons |
| `README.md` | Docker, GH_TOKEN, operação |
| `docs/shadcn-for-agents.md` | UI |
| `docs/design-system.md` | Tokens, Surface |
| `docs/zod-validation.md` | Validação |

**Sugerido:** expandir `CONTEXT.md` conforme novos módulos forem implementados.

---

## Próximo passo

Escolher um ou mais itens para o loop de design (constraints, forma do módulo aprofundado, testes no seam).
