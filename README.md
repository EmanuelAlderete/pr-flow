# MVP Acompanhador de PR (pr-flow)

Monitor local para acompanhar PRs abertas de autoria do usuario em multiplos repositorios, com Tasks e Journal no mesmo app.

**Docs para agentes:** [AGENTS.md](AGENTS.md) · [docs/shadcn-for-agents.md](docs/shadcn-for-agents.md) · [docs/design-system.md](docs/design-system.md) · [docs/zod-validation.md](docs/zod-validation.md)

## Pre-requisitos

**Docker (recomendado — plug and play)**

- Docker e Docker Compose
- Token do GitHub (`GH_TOKEN`) — veja [Como obter o GH_TOKEN](#como-obter-o-gh_token)

**Desenvolvimento local (opcional)**

- Node.js 20+
- npm
- GitHub CLI (`gh`) com `gh auth login`, **ou** `GH_TOKEN` no `.env`

---

## Inicio rapido com Docker

### 1. Configurar ambiente

**Instalação guiada (recomendado para novos devs):**

```bash
./scripts/install.sh   # ou: npm run install:docker
```

O script pergunta as variáveis necessárias, grava o `.env` e roda `docker compose build`.

**Manual:**

```bash
cp .env.example .env
```

Edite o `.env` (repos monitorados e token GitHub):

```env
MONITORED_REPOSITORIES=owner/repo-1,owner/repo-2
```

**Token GitHub (Docker):** o container **nao** le `~/.config/gh` do seu PC sozinho — so usa `GH_TOKEN` do `.env`. Para copiar o login do `gh` da maquina:

```bash
gh auth status          # precisa estar logado no host
./scripts/sync-gh-env.sh  # ou: npm run gh:sync-env
```

Se aparecer *"not an executable file"*:

```bash
chmod +x scripts/sync-gh-env.sh
# ou rode sem permissao de execucao:
bash scripts/sync-gh-env.sh
```

Use o **seu usuario** (nao `sudo`). Depois do sync, reinicie o Compose:

```bash
docker compose up -d --build
```

Isso grava `GH_TOKEN` no `.env` com o valor de `gh auth token` (OAuth do `gh auth login`). Evita PAT fine-grained sem acesso a org privada.

O `DATABASE_URL` no exemplo ja aponta para o Postgres do Compose (`host: postgres`). Nao precisa alterar para o fluxo Docker.

### 2. Subir tudo

```bash
docker compose up --build
```

Na primeira execucao a imagem e construida, as migrations rodam automaticamente e o app inicia.

### 3. Abrir o app

[http://localhost:3847](http://localhost:3847)

A porta padrao e **3847** (evita conflito com outros servicos na 3000).

### 4. Observabilidade (Grafana)

O Compose sobe Loki, Promtail, Prometheus e Grafana junto com o app.

| Servico | URL | Credenciais |
|---------|-----|-------------|
| Grafana | [http://localhost:3848](http://localhost:3848) | `admin` / `prflow` |
| Prometheus | [http://localhost:9090](http://localhost:9090) | — |
| Loki | [http://localhost:3100](http://localhost:3100) | — |

Dashboard provisionado: **PR Flow** (crons + system logs). Em **Devtools → Crons**, cada job tem link **Ver logs no Grafana**.

System logs saem em JSON Lines no stdout do container (`LOG_FORMAT=json` no Docker). Em `npm run dev` local, o padrao e legivel (`LOG_FORMAT=pretty` opcional).

### Comandos uteis

```bash
# Segundo plano
docker compose up -d --build

# Ver logs
docker compose logs -f app

# Parar
docker compose down

# Parar e apagar dados do Postgres
docker compose down -v
```

---

## Como obter o GH_TOKEN

O app chama o `gh` CLI. No Docker, a autenticacao vem da variavel `GH_TOKEN`.

### Opcao A — igual ao `npm run dev` (recomendado)

Se voce ja usa `gh auth login` no host:

```bash
gh auth status
./scripts/sync-gh-env.sh   # npm run gh:sync-env
docker compose up -d --build
```

Equivalente manual: coloque `GH_TOKEN=$(gh auth token)` no `.env` (sem `sudo`).

O Docker **nao** monta o `gh` do host automaticamente; este script apenas **copia o token** para o `.env`.

### Opcao B — Personal Access Token

1. Abra [GitHub → Settings → Developer settings → Personal access tokens](https://github.com/settings/tokens).
2. Crie um token classic (`ghp_...`) ou fine-grained (`github_pat_...`).
3. Escopos minimos: **repo**, **read:user**.
4. Para org privada com SSO: em [tokens](https://github.com/settings/tokens), clique **Configure SSO** e autorize a org (ex.: `jusfy`).
5. Fine-grained: inclua explicitamente cada repo em `MONITORED_REPOSITORIES`.

```env
GH_TOKEN=github_pat_xxxxxxxx
```

### Opcao C — montar credenciais do host (sem GH_TOKEN no .env)

```bash
UID=$(id -u) GID=$(id -g) docker compose -f docker-compose.yml -f docker-compose.gh-host.yml up --build
```

### Erro: "Could not resolve to a Repository"

`gh auth status` ok, mas GraphQL falha no Docker: o `GH_TOKEN` do `.env` nao tem acesso aos repos (PAT sem SSO da org ou sem permissao). Rode `./scripts/sync-gh-env.sh` ou autorize o PAT na org.

Trate o token como senha: nao commite o `.env` e revogue no GitHub se vazar.

---

## Desenvolvimento local (sem container do app)

Util se voce quiser hot-reload do Next.js na maquina host.

### 1. Postgres via Docker

```bash
docker compose up -d postgres
```

### 2. `.env` para o host

```env
PORT=3847
GH_TOKEN=github_pat_xxxxxxxx
MONITORED_REPOSITORIES=owner/repo-1,owner/repo-2
DATABASE_URL=postgresql://prflow:prflow@localhost:5432/prflow
```

### 3. Instalar e migrar

```bash
npm install
npm run db:migrate
```

### 4. Rodar

```bash
npm run dev
```

App em [http://localhost:3847](http://localhost:3847).

Autenticacao GitHub no host: use `GH_TOKEN` no `.env` **ou** `gh auth login`.

Para testar build de producao na maquina: `npm run build` e depois `npm run start`. Nao use `next start` direto — o projeto usa `output: "standalone"` e rotas como `/api/prs/slack-share` retornam 404 com o servidor errado.

---

## Variaveis de ambiente

| Variavel | Obrigatoria | Descricao |
|----------|-------------|-----------|
| `GH_TOKEN` | Sim (PRs) | Token GitHub (`gh auth token` ou PAT); ver [Como obter o GH_TOKEN](#como-obter-o-gh_token) |
| `MONITORED_REPOSITORIES` | Sim (PRs) | Lista `owner/repo` separada por virgula |
| `DATABASE_URL` | Sim (Tasks/Journal/Dashboard) | URL PostgreSQL |
| `GEMINI_API_KEY` | Sim (resumo diario) | Chave da API Gemini ([Google AI Studio](https://aistudio.google.com/apikey)) |
| `GEMINI_MODEL` | Nao | Modelo Gemini (padrao `gemini-2.5-flash`) |
| `JIRA_EMAIL` | Sim (modulo Jira) | E-mail da conta Atlassian usada no token |
| `JIRA_TOKEN` | Sim (modulo Jira) | API token do Jira ([Atlassian](https://id.atlassian.com/manage-profile/security/api-tokens)) |
| `JIRA_SITE_URL` | Nao | URL do site (padrao `https://jusfy.atlassian.net`) |
| `JIRA_SPRINT_PROJECT_KEY` | Nao | Projeto para listar sprints (padrao `JOR`) |
| `JIRA_SPRINT_BOARD_ID` | Nao | Board Scrum fixo; se omitido, usa o board scrum do projeto |
| `DISABLE_JIRA_SYNC_CRON` | Nao | Defina `1` para desligar a sincronizacao automatica do Jira com o Postgres |
| `DISABLE_PR_SYNC_CRON` | Nao | Defina `1` para desligar a sincronizacao automatica de PRs |
| `DISABLE_SUMMARY_CRON` | Nao | Defina `1` para desligar resumos diario/semanal (meia-noite) |
| `DISABLE_DASHBOARD_BRIEFING_CRON` | Nao | Defina `1` para desligar o briefing horario do dashboard |
| `SUMMARY_CRON_TZ` | Nao | Fuso dos crons de resumo e briefing (padrao `America/Sao_Paulo`) |
| `PORT` | Nao | Porta HTTP (padrao **3847**) |
| `SLACK_BOT_OAUTH_TOKEN` | Nao (Slack) | Bot token para enviar PRs ao canal `squad-jornada-pr` (escopo `chat:write`) |
| `SLACK_PR_CHANNEL` | Nao | Canal Slack para PRs (padrao `squad-jornada-pr`) |

O modulo Jira le tickets, sprints e detalhes do PostgreSQL. Uma cron interna (`*/10 * * * *`) atualiza o cache a partir da API do Jira na subida do servidor e a cada 10 minutos. A primeira carga ocorre ao iniciar o app; ate la a UI pode retornar 503.

---

## Comandos npm

```bash
npm test              # testes
npm run build         # build de producao
npm run start         # producao local (standalone; requer build antes)
npm run install:docker  # wizard .env + docker compose build
npm run gh:sync-env   # copia gh auth token -> .env (Docker)
npm run db:migrate    # migrations (drizzle-kit, dev local)
npm run db:migrate:docker  # migrations via drizzle-orm (mesmo script do container)
```

---

## Comportamentos principais do MVP

- Mostra somente PRs abertas do usuario autenticado no GitHub
- Usa apenas `requested_reviewers` como universo esperado
- Considera "avaliou" como qualquer review (`COMMENTED`, `APPROVED`, `CHANGES_REQUESTED`)
- Quando ha varios reviews da mesma pessoa, o ultimo review vence
- PR sem reviewers solicitados continua visivel com indicador explicito
- Atualiza automaticamente via polling e permite refresh manual

---

## Arquitetura Docker

```
docker compose
├── postgres   — PostgreSQL 16 (volume persistente)
└── app        — Next.js + gh CLI + migrations no startup
```

O container `app` recebe do `.env` (interpolacao do Compose) `GH_TOKEN`, `MONITORED_REPOSITORIES`, credenciais Jira (`JIRA_EMAIL`, `JIRA_TOKEN`, opcionais `JIRA_*`), Gemini e Slack (`SLACK_BOT_OAUTH_TOKEN`, opcional `SLACK_PR_CHANNEL`). Prefira `GH_TOKEN` de `gh auth token` para paridade com o host. Alternativa: `docker-compose.gh-host.yml` monta `~/.config/gh`.
