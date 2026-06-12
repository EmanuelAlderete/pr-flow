# Agentes — PR Flow

Guia rápido para trabalhar neste repositório. Vocabulário de domínio (notebook day, briefing vs resumo): **[CONTEXT.md](CONTEXT.md)**.

## Antes de mudar UI

1. **[docs/shadcn-for-agents.md](docs/shadcn-for-agents.md)** — usar **preferencialmente** componentes shadcn (`@/components/ui/*`); quando adicionar UI nova, começar por aqui.
2. **[docs/design-system.md](docs/design-system.md)** — tokens, acento laranja ember, componente `Surface`, pt-BR, e o que não misturar com cores de status de PR.

## Antes de validar dados (API, env, JSON externo)

1. **[docs/zod-validation.md](docs/zod-validation.md)** — usar **Zod** para query params, body JSON, respostas de terceiros e cache; ver quando é opcional e como nomear arquivos (vs. `schema.ts` do Drizzle).

Implementação dos tokens: `app/globals.css` (`.dark`).

## Stack

- Next.js (App Router), React, TypeScript
- Tailwind v4 + shadcn/ui (`components/ui/`)
- PostgreSQL + Drizzle (Tasks, Journal, Summaries, Dashboard, cache Jira)
- PRs via GitHub CLI / `GH_TOKEN`

## Rotas principais

| Rota | Módulo |
|------|--------|
| `/dashboard` | Hub + briefing do dia (IA, atualizado a cada hora) |
| `/prs` | Minhas pull requests (monitor completo) |
| `/prs/reviews` | PRs em que sou revisor (fila simples) |
| `/tasks` | Tarefas abertas/concluídas |
| `/journal` | Notas markdown por dia |
| `/summaries` | Histórico de resumos (UI pt-BR; redirect legado `/summaries`) |
| `/jira` | Tickets Jira atribuídos ao usuário |
| `/devtools/crons` | Forçar execução on-demand dos fluxos agendados (confirmação manual) |
| `/api/metrics` | Métricas Prometheus (crons, boot) |

Redirect `/` → `/dashboard`.

Rodapé do sidebar: **Devtools** → Crons, Repositórios. Observabilidade: Grafana em `http://localhost:3848` (Docker Compose; login `admin` / `prflow`).

## Comandos

```bash
npm run dev      # http://localhost:3847
npm test
npm run build
```

Ver `README.md` para Docker, `GH_TOKEN`, `GEMINI_API_KEY`, `JIRA_EMAIL`, `JIRA_TOKEN`. Repositórios GitHub monitorados: cadastro em **Devtools → Repositórios** (tabela `monitored_repositories`); na primeira execução importa `MONITORED_REPOSITORIES` do `.env` se o banco estiver vazio. Crons: `modules/cron-scheduling/` (`startAllCrons` em `instrumentation.ts`). Jira sync 10 min (`DISABLE_JIRA_SYNC_CRON=1`). Briefing horário (`DISABLE_DASHBOARD_BRIEFING_CRON=1`). Resumos meia-noite (`DISABLE_SUMMARY_CRON=1`); no boot, `runSummaryCatchup` consulta `summaries` e gera dias/semana pendentes (até 14 dias) se o app estava offline à meia-noite.

## Convenções de código

- **Idioma:** código (identificadores, rotas, módulos, comentários, descrições de teste) em **inglês**; **pt-BR** só em UI e mensagens ao usuário. Copy pt-BR centralizado em `modules/messages/pt-BR.ts`. Prompts LLM permanecem pt-BR (saída do produto). Ver também `docs/design-system.md`.
- UI nova fora do módulo PRs: `Surface` + shadcn; não criar terceiro estilo de card. Ver `docs/shadcn-for-agents.md`.
- Dados não confiáveis (request, env, APIs externas, `sessionStorage`): validar com **Zod** quando possível. Ver `docs/zod-validation.md`.
- Não commitar `.env`.
- Testes: Vitest em `tests/`; atualizar se mudar labels pt-BR ou `aria-label`.
