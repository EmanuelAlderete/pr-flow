# PR Flow

Hub local do dia de trabalho: monitora PRs no GitHub, organiza tarefas e journal, sincroniza Jira e gera resumos e briefing com IA — tudo em um único app.

Pensado para quem joga vários repositórios, revisores e tickets ao mesmo tempo e quer um painel próprio, sem depender de dashboards genéricos.

**App:** [http://localhost:3847](http://localhost:3847)

---

## O que o PR Flow faz

| Área | O que você ganha |
|------|------------------|
| **Dashboard** | Hub do dia: briefing com IA, eventos do Google Calendar, countdown de férias, streak do journal e deck de atalhos pessoais |
| **PRs** | Monitor das suas PRs abertas (reviewers, status) + fila de reviews + wizard para abrir PR a partir de branches |
| **Jira** | Tickets atribuídos a você, com sync automático; criação de branch com nome sugerido por IA |
| **Tasks & Journal** | Tarefas locais e notas markdown por dia (notebook day), com streak de dias úteis |
| **Resumos** | Resumo diário (Feedback 3×3) e semanal (Bússola de Tendência), gerados à meia-noite |
| **Slack** | Compartilhar PR no canal do time com um clique |
| **Devtools** | Forçar crons, gerenciar repositórios monitorados e subir o Portainer do stack Jusfy local |

---

## Features

### Hub do dia (`/dashboard`)
- **Briefing horário** — mapa de batalha do dia (fechamento do último dia útil, desbloqueios, foco), gerado com Gemini
- **Eventos do dia** — compromissos de hoje via feed iCal secreto do Google Calendar
- **Streak do journal** — sequência de dias úteis com nota; sábado/domingo não quebram a sequência
- **Countdown de férias** — data no `localStorage`, widget no dashboard (e na sidebar, alternando com o clima)
- **Deck de atalhos** — links pessoais com ícone, cor e ordem definidos por você

### Pull requests (`/prs`, `/prs/reviews`, `/prs/open`)
- Mostra só PRs **abertas** do usuário autenticado no GitHub
- Universo de reviewers = `requested_reviewers`; “avaliou” = qualquer review (`COMMENTED`, `APPROVED`, `CHANGES_REQUESTED`); último review da pessoa vence
- PR sem reviewers continua visível, com indicador explícito
- Sync por cron + refresh manual; compartilhamento no Slack
- **Revisão local:** a cada 15 minutos, uma PR com commit novo é revisada no clone local pelo Claude Code (Haiku e subagentes). O resultado aparece no card. A IA não aprova nem rejeita no GitHub
- **Abrir PR:** descobre branches suas, sugere base, monta título/corpo (IA opcional) e cria via `gh`
- **Fila de reviews:** PRs em que você é revisor, em lista simples

### Jira (`/jira`)
- Cache local atualizado a cada ~10 min
- Detalhe do ticket, linkify de chaves `JOR-xxx` em markdown
- **Criar branch com IA:** escolher repos monitorados → slug sugerido (`feat/` / `fix/`) → criar refs remotas no GitHub

### Journal & Tasks (`/journal`, `/tasks`)
- Uma nota markdown ativa por dia (soft-delete); corpo obrigatório
- Calendário com marcador nos dias que já têm nota
- Tasks abertas/concluídas ligadas ao notebook day

### Resumos (`/summaries`)
- Diário e semanal a partir do contexto do notebook day (journal + tasks + Jira + PRs)
- Catch-up no boot: se o app estava offline à meia-noite, gera até 14 dias pendentes
- Tom ajustável por nível de carreira (`SUMMARY_CAREER_LEVEL`)

### Devtools
- **Crons** — disparo on-demand com confirmação
- **Repositórios** — cadastro em UI (`monitored_repositories`); na 1ª execução importa `MONITORED_REPOSITORIES` do `.env` se o banco estiver vazio
- **Ambiente local** — Portainer do stack Jusfy (`LOCAL_DOCKER_ROOT` + `JUSFY_ROOT`)

---

## Startup rápido (npm)

Pré-requisitos: **Node.js 22**, **GitHub CLI** (`gh`). O banco usa o SQLite embutido do Node (`NODE_OPTIONS=--experimental-sqlite`, já ligado nos scripts npm). A revisão local também precisa do **Claude Code** no PATH, autenticado pela assinatura (`claude` ou `claude setup-token`). Não defina `ANTHROPIC_API_KEY` nesse processo.

```bash
npm install
cp .env.example .env
# edite GH_TOKEN, MONITORED_REPOSITORIES e o restante
npm run db:migrate
npm run dev                  # http://localhost:3847
```

Se você já tem dados no Postgres deste app:

```bash
# o Postgres antigo precisa responder em localhost:5432
npm run db:import-postgres      # copia para data/pr-flow.sqlite e ajusta o .env
```

Produção local: `npm run build` e depois `npm run start`. Não use `next start` direto.

GitHub no host: `GH_TOKEN` no `.env` **ou** `gh auth login`.

---

## Docker (opcional)

O Compose sobe só o app, com o SQLite em `./data`. A revisão local fica desligada no container (`DISABLE_PR_LOCAL_REVIEW_CRON=1`), porque o Claude Code está no host.

Pré-requisitos: **Docker** + **Docker Compose**. Token GitHub: veja [Como obter o GH_TOKEN](#como-obter-o-gh_token).

### 1. Instalar

```bash
./scripts/install.sh   # ou: npm run install:docker
```

Wizard interativo: coleta GitHub, Gemini, Jira, Calendar e Slack (com links de onde obter cada credencial), valida o essencial, grava o `.env` e faz `docker compose build`.

**Manual:**

```bash
cp .env.example .env
# edite GH_TOKEN e MONITORED_REPOSITORIES
```

Se você já usa `gh auth login` no host:

```bash
gh auth status
./scripts/sync-gh-env.sh   # copia o token para o .env
```

### 2. Subir

```bash
docker compose up --build
# ou em segundo plano:
docker compose up -d --build
```

Na primeira execução: build da imagem, migrations do SQLite em `./data` e start do app.

### 3. Abrir

| Serviço | URL |
|---------|-----|
| **PR Flow** | [http://localhost:3847](http://localhost:3847) |

Porta **3847** de propósito (evita briga com outros serviços na 3000).

### Comandos Docker úteis

```bash
docker compose logs -f app   # logs do app
docker compose down          # parar
docker compose down          # o arquivo SQLite em ./data permanece
```

---

## Desenvolvimento local

O caminho padrão é o [startup com npm](#startup-rápido-npm). `npm run dev` aplica as migrations do SQLite na primeira conexão.

`npm run start` (standalone) também aponta o banco para `data/pr-flow.sqlite` na raiz do projeto. Não use `next start` direto — rotas como `/api/prs/slack-share` quebram.

---

## Comandos npm

| Comando | Uso |
|---------|-----|
| `npm run install:docker` | Wizard `.env` + `docker compose build` |
| `npm run gh:sync-env` | Copia `gh auth token` → `.env` (Docker) |
| `npm run dev` | Dev server na porta 3847 |
| `npm test` | Testes (Vitest) |
| `npm run test:watch` | Testes em watch |
| `npm run build` | Build de produção |
| `npm run start` | Produção local (standalone; requer build) |
| `npm run db:migrate` | Aplica migrations no SQLite |
| `npm run db:import-postgres` | Copia os dados do Postgres antigo para o SQLite |
| `npm run db:generate` | Gerar migration a partir do schema |

---

## Módulos

Código organizado por domínio em `modules/`. Rotas App Router em `app/(shell)/` e `app/api/`.

| Módulo | Responsabilidade |
|--------|------------------|
| `dashboard` | Hub, widgets e briefing |
| `prs` | Monitor, reviews, abrir PR, sync GitHub, Slack share |
| `jira` | UI e sync de tickets atribuídos |
| `jira-branch` | Wizard de criação de branch com IA |
| `jira-issue-key` | Extração/normalização de chaves e linkify |
| `tasks` | Tarefas locais |
| `journal` | Notas por dia, streak, marcadores no calendário |
| `notebook-day` | Contexto do dia para IA (journal + tasks + Jira + PRs) |
| `summaries` | Resumos diário/semanal e catch-up |
| `llm-generation` | Seam Gemini (`LlmTextGenerator`) compartilhado |
| `day-calendar` | Eventos do dia via iCal |
| `vacation-countdown` | Countdown de férias (`localStorage`) |
| `shortcut-deck` | Deck de atalhos do dashboard |
| `cron-scheduling` | Specs e `startAllCrons()` no boot |
| `devtools` | Runners de cron on-demand, repositórios |
| `local-docker` | Portainer / stack Jusfy local |
| `observability` | System logs (stdout) |
| `slack` | Integração de envio ao canal |
| `work-context` | Diálogo de contexto de trabalho |
| `messages` | Copy pt-BR centralizado |
| `db` | Drizzle / SQLite |
| `notifications` | Toasts / feedback de UI |

### Rotas principais

| Rota | Conteúdo |
|------|----------|
| `/dashboard` | Hub do dia |
| `/prs` | Minhas PRs |
| `/prs/reviews` | Fila de reviews |
| `/prs/open` | Wizard abrir PR |
| `/jira` | Tickets Jira |
| `/tasks` | Tarefas |
| `/journal` | Journal |
| `/summaries` | Histórico de resumos |
| `/devtools/crons` | Disparo manual de crons |
| `/devtools/local-docker` | Ambiente local Jusfy |

`/` redireciona para `/dashboard`.

### Crons (no boot)

| Job | Frequência | Desligar com |
|-----|------------|--------------|
| Sync de PRs | a cada 10 min | `DISABLE_PR_SYNC_CRON=1` |
| Revisão local de PRs | a cada 15 min, uma PR por vez | `DISABLE_PR_LOCAL_REVIEW_CRON=1` |
| Sync Jira | a cada 10 min | `DISABLE_JIRA_SYNC_CRON=1` |
| Briefing do dashboard | horária | `DISABLE_DASHBOARD_BRIEFING_CRON=1` |
| Resumos diário/semanal | meia-noite | `DISABLE_SUMMARY_CRON=1` |

Fuso padrão: `America/Sao_Paulo` (`SUMMARY_CRON_TZ`).

---

## Variáveis de ambiente

| Variável | Obrigatória | Descrição |
|----------|-------------|-----------|
| `GH_TOKEN` | Sim (PRs) | Token GitHub — ver [abaixo](#como-obter-o-gh-token) |
| `MONITORED_REPOSITORIES` | Sim (PRs) | `owner/repo` separados por vírgula (seed inicial) |
| `DATABASE_URL` | Sim | SQLite. Padrão `file:./data/pr-flow.sqlite` |
| `CLAUDE_CODE_OAUTH_TOKEN` | Não | Token da assinatura do Claude Code (`claude setup-token`). Sem isso, vale o login já feito no host |
| `PR_REVIEW_MODEL` | Não | Modelo da revisão local. Padrão `haiku` |
| `GEMINI_API_KEY` | Sim (IA) | [Google AI Studio](https://aistudio.google.com/apikey) |
| `GEMINI_MODEL` | Não | Padrão `gemini-2.5-flash` |
| `GEMINI_MODEL_FALLBACK` | Não | Modelos reserva (vírgula) se 503 |
| `JIRA_EMAIL` / `JIRA_TOKEN` | Sim (Jira) | [API token Atlassian](https://id.atlassian.com/manage-profile/security/api-tokens) |
| `JIRA_SITE_URL` | Não | Padrão `https://jusfy.atlassian.net` |
| `SLACK_BOT_OAUTH_TOKEN` | Não | Bot com escopo `chat:write` |
| `SLACK_PR_CHANNEL` | Não | Padrão `squad-jornada-pr` |
| `GOOGLE_CALENDAR_ICAL_URL` | Não | Feed iCal secreto (não commitar) |
| `SUMMARY_CAREER_LEVEL` | Não | `junior` \| `pleno` \| `senior` |
| `PORT` | Não | Padrão **3847** |
| `LOCAL_DOCKER_ROOT` / `JUSFY_ROOT` | Não | Stack Jusfy no Devtools |
| `LOCAL_DOCKER_PORTAINER_URL` | Não | Padrão `https://localhost:9443` |

Lista completa e flags de cron: `.env.example`.

---

## Como obter o GH_TOKEN

No Docker o container **não** lê `~/.config/gh` sozinho — só usa `GH_TOKEN` do `.env`.

### Opção A — igual ao `npm run dev` (recomendado)

```bash
gh auth status
./scripts/sync-gh-env.sh   # npm run gh:sync-env
docker compose up -d --build
```

### Opção B — Personal Access Token

1. [GitHub → Personal access tokens](https://github.com/settings/tokens)
2. Classic (`ghp_...`) ou fine-grained (`github_pat_...`)
3. Escopos mínimos: **repo**, **read:user**
4. Org privada com SSO: **Configure SSO** e autorize a org
5. Fine-grained: inclua cada repo de `MONITORED_REPOSITORIES`

### Opção C — montar credenciais do host

```bash
UID=$(id -u) GID=$(id -g) docker compose -f docker-compose.yml -f docker-compose.gh-host.yml up --build
```

**Erro "Could not resolve to a Repository":** token sem acesso aos repos (SSO/PAT). Rode `./scripts/sync-gh-env.sh` ou autorize o PAT na org.

Trate o token como senha: não commite o `.env`.

---

## Arquitetura Docker

```
docker compose
└── app          — Next.js + gh CLI + SQLite em ./data
```

A revisão local não roda nesse container. Ela usa o Claude Code do host, via `npm run dev` ou `npm run start`.

System logs em JSON Lines no Docker (`LOG_FORMAT=json`). Em `npm run dev`, o padrão é legível (`LOG_FORMAT=pretty` opcional). Ver com `docker compose logs -f app`.

---

## Stack

- **Next.js** (App Router) · React · TypeScript
- **Tailwind v4** + **shadcn/ui**
- **PostgreSQL** + **Drizzle**
- **GitHub CLI** / `GH_TOKEN` para PRs
- **Gemini** para resumos, briefing e sugestões
- UI em **pt-BR**; código e identificadores em **inglês**

---

## Docs para agentes e contribuidores

| Doc | Quando usar |
|-----|-------------|
| [AGENTS.md](AGENTS.md) | Rotas, stack, convenções rápidas |
| [CONTEXT.md](CONTEXT.md) | Vocabulário de domínio (notebook day, briefing vs resumo, streak…) |
| [docs/design-system.md](docs/design-system.md) | Tokens, Surface, acento ember |
| [docs/shadcn-for-agents.md](docs/shadcn-for-agents.md) | Preferência por componentes shadcn |
| [docs/zod-validation.md](docs/zod-validation.md) | Validação de request/env/APIs externas |
