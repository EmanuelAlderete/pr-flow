#!/usr/bin/env bash
# PR Flow — instalador Docker guiado (.env + build)
set -euo pipefail

root="$(cd "$(dirname "$0")/.." && pwd)"
env_file="$root/.env"
example_file="$root/.env.example"

declare -A ENV_VALUES=()
STEP=0
STEP_TOTAL=5

# Links oficiais para obter credenciais (mostrados no wizard)
readonly URL_GH_TOKEN="https://github.com/settings/tokens"
readonly URL_GH_CLI="https://cli.github.com/"
readonly URL_GEMINI="https://aistudio.google.com/apikey"
readonly URL_JIRA_TOKEN="https://id.atlassian.com/manage-profile/security/api-tokens"
readonly URL_SLACK_APPS="https://api.slack.com/apps"
readonly URL_GCAL_HELP="https://support.google.com/calendar/answer/37648"

if [[ -t 1 ]]; then
  RESET=$'\033[0m'
  BOLD=$'\033[1m'
  DIM=$'\033[2m'
  ITALIC=$'\033[3m'
  UNDERLINE=$'\033[4m'
  RED=$'\033[31m'
  GREEN=$'\033[32m'
  YELLOW=$'\033[33m'
  BLUE=$'\033[34m'
  CYAN=$'\033[36m'
  ORANGE=$'\033[38;5;208m'
  GRAY=$'\033[90m'
  WHITE=$'\033[97m'
  BG_DIM=$'\033[48;5;236m'
else
  RESET=BOLD=DIM=ITALIC=UNDERLINE=RED=GREEN=YELLOW=BLUE=CYAN=ORANGE=GRAY=WHITE=BG_DIM=''
fi

icon_ok="${GREEN}✓${RESET}"
icon_fail="${RED}✗${RESET}"
icon_arrow="${ORANGE}→${RESET}"
icon_dot="${ORANGE}●${RESET}"
icon_skip="${GRAY}○${RESET}"
icon_link="${CYAN}↗${RESET}"
icon_tip="${BLUE}*${RESET}"

die() {
  echo
  echo -e "  ${icon_fail} ${RED}${BOLD}Erro${RESET} ${DIM}—${RESET} $*"
  exit 1
}

print_banner() {
  echo
  echo -e "${ORANGE}${BOLD}"
  cat <<'EOF'
  ┌──────────────────────────────────────┐
  │                                      │
  │              PR FLOW                 │
  │                                      │
  └──────────────────────────────────────┘
EOF
  echo -e "${RESET}"
  echo -e "  ${WHITE}${BOLD}Instalador Docker${RESET}"
  echo -e "  ${GRAY}configura o .env, valida o essencial e builda a imagem${RESET}"
  echo
  echo -e "  ${DIM}Campos com Enter vazio usam o valor atual (se houver) ou pulam opcionais.${RESET}"
  echo -e "  ${DIM}Links ${icon_link}${DIM} abrem no navegador se você colar a URL.${RESET}"
  echo
}

progress_bar() {
  local current="$1"
  local total="$2"
  local width=28
  local filled=$((current * width / total))
  local empty=$((width - filled))
  local bar=""
  local i

  for ((i = 0; i < filled; i++)); do bar+="█"; done
  for ((i = 0; i < empty; i++)); do bar+="░"; done

  echo -e "  ${DIM}${bar}${RESET}  ${ORANGE}${BOLD}${current}${RESET}${DIM}/${total}${RESET}"
}

step_header() {
  local title="$1"
  STEP=$((STEP + 1))
  echo
  progress_bar "$STEP" "$STEP_TOTAL"
  echo -e "  ${CYAN}${BOLD}Etapa ${STEP}/${STEP_TOTAL}${RESET}  ${WHITE}${BOLD}${title}${RESET}"
  echo -e "  ${DIM}$(printf '%.0s─' {1..52})${RESET}"
  echo
}

section() {
  echo
  echo -e "  ${ORANGE}${BOLD}$1${RESET}"
  echo -e "  ${DIM}$(printf '%.0s─' {1..40})${RESET}"
}

info() {
  echo -e "  ${BLUE}ℹ${RESET}  $*"
}

success() {
  echo -e "  ${icon_ok} ${GREEN}$*${RESET}"
}

warn() {
  echo -e "  ${YELLOW}!${RESET}  $*"
}

tip() {
  echo -e "  ${icon_tip}  ${DIM}$*${RESET}"
}

link_hint() {
  local label="$1"
  local url="$2"
  echo -e "  ${icon_link}  ${GRAY}${label}:${RESET} ${UNDERLINE}${CYAN}${url}${RESET}"
}

help_block() {
  local title="$1"
  shift
  echo -e "  ${BG_DIM} ${BOLD}${title}${RESET}${BG_DIM} ${RESET}"
  while [[ $# -gt 0 ]]; do
    echo -e "  ${DIM}  $*${RESET}"
    shift
  done
}

prompt_yn() {
  local question="$1"
  local default="${2:-n}"
  local hint="[s/N]"
  local input=""

  if [[ "$default" == "y" ]]; then
    hint="[S/n]"
  fi

  read -r -p "$(echo -e "  ${icon_arrow} ${question} ${DIM}${hint}${RESET}: ")" input
  input="${input:-$default}"

  if [[ "$input" =~ ^[SsYy]$ ]]; then
    return 0
  fi
  return 1
}

require_command() {
  if ! command -v "$1" >/dev/null 2>&1; then
    die "$2"
  fi
}

load_existing_env() {
  [[ -f "$env_file" ]] || return 0

  while IFS= read -r line || [[ -n "$line" ]]; do
    # Ignora comentários e linhas vazias; preserva valores com = no meio
    if [[ "$line" =~ ^[[:space:]]*# ]] || [[ -z "${line// }" ]]; then
      continue
    fi
    if [[ "$line" =~ ^([A-Za-z_][A-Za-z0-9_]*)=(.*)$ ]]; then
      ENV_VALUES["${BASH_REMATCH[1]}"]="${BASH_REMATCH[2]}"
    fi
  done <"$env_file"
}

mask_secret() {
  local value="$1"
  local len=${#value}
  if [[ "$len" -eq 0 ]]; then
    echo "(vazio)"
    return
  fi
  if [[ "$len" -le 8 ]]; then
    echo "********"
    return
  fi
  echo "${value:0:4}…${value: -4}"
}

prompt_value() {
  local key="$1"
  local label="$2"
  local required="$3"
  local default="${ENV_VALUES[$key]:-}"
  local input=""

  while true; do
    if [[ -n "$default" ]]; then
      read -r -p "$(echo -e "    ${CYAN}${label}${RESET} ${DIM}[${default}]${RESET}: ")" input
      input="${input:-$default}"
    else
      read -r -p "$(echo -e "    ${CYAN}${label}${RESET}: ")" input
    fi

    input="$(printf '%s' "$input" | sed -e 's/^[[:space:]]*//' -e 's/[[:space:]]*$//')"

    if [[ -n "$input" ]]; then
      ENV_VALUES["$key"]="$input"
      return 0
    fi

    if [[ "$required" == "optional" ]]; then
      unset 'ENV_VALUES[$key]'
      echo -e "    ${icon_skip} ${DIM}pulado${RESET}"
      return 0
    fi

    warn "Campo obrigatório. Tente novamente."
  done
}

prompt_secret() {
  local key="$1"
  local label="$2"
  local required="$3"
  local default="${ENV_VALUES[$key]:-}"
  local input=""
  local hint=""

  if [[ -n "$default" ]]; then
    hint=" ${DIM}(Enter mantém ${RESET}${GRAY}$(mask_secret "$default")${RESET}${DIM})${RESET}"
  fi

  while true; do
    read -r -s -p "$(echo -e "    ${CYAN}${label}${RESET}${hint}: ")" input
    echo

    if [[ -z "$input" && -n "$default" ]]; then
      ENV_VALUES["$key"]="$default"
      return 0
    fi

    input="$(printf '%s' "$input" | sed -e 's/^[[:space:]]*//' -e 's/[[:space:]]*$//')"

    if [[ -n "$input" ]]; then
      ENV_VALUES["$key"]="$input"
      return 0
    fi

    if [[ "$required" == "optional" ]]; then
      unset 'ENV_VALUES[$key]'
      echo -e "    ${icon_skip} ${DIM}pulado${RESET}"
      return 0
    fi

    warn "Campo obrigatório. Tente novamente."
  done
}

prompt_choice() {
  local key="$1"
  local label="$2"
  local required="$3"
  shift 3
  local options=("$@")
  local default="${ENV_VALUES[$key]:-}"
  local input=""
  local joined=""
  local opt

  for opt in "${options[@]}"; do
    if [[ -n "$joined" ]]; then
      joined+=", "
    fi
    joined+="$opt"
  done

  while true; do
    if [[ -n "$default" ]]; then
      read -r -p "$(echo -e "    ${CYAN}${label}${RESET} ${DIM}(${joined}) [${default}]${RESET}: ")" input
      input="${input:-$default}"
    else
      read -r -p "$(echo -e "    ${CYAN}${label}${RESET} ${DIM}(${joined})${RESET}: ")" input
    fi

    input="$(printf '%s' "$input" | sed -e 's/^[[:space:]]*//' -e 's/[[:space:]]*$//' | tr '[:upper:]' '[:lower:]')"

    if [[ -z "$input" && "$required" == "optional" ]]; then
      unset 'ENV_VALUES[$key]'
      echo -e "    ${icon_skip} ${DIM}pulado (padrão do app)${RESET}"
      return 0
    fi

    for opt in "${options[@]}"; do
      if [[ "$input" == "$opt" ]]; then
        ENV_VALUES["$key"]="$input"
        return 0
      fi
    done

    warn "Escolha uma das opções: ${joined}"
  done
}

validate_monitored_repositories() {
  local value="${ENV_VALUES[MONITORED_REPOSITORIES]:-}"
  if [[ ! "$value" =~ ^[^/,[:space:]]+/[^/,[:space:]]+ ]]; then
    die "MONITORED_REPOSITORIES deve listar repos no formato owner/repo (ex.: jusfy/app-1,jusfy/app-2)."
  fi
}

validate_email() {
  local value="${ENV_VALUES[JIRA_EMAIL]:-}"
  [[ -z "$value" ]] && return 0
  if [[ ! "$value" =~ ^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$ ]]; then
    die "JIRA_EMAIL parece inválido: ${value}"
  fi
}

validate_ical_url() {
  local value="${ENV_VALUES[GOOGLE_CALENDAR_ICAL_URL]:-}"
  [[ -z "$value" ]] && return 0
  if [[ ! "$value" =~ ^https:// ]]; then
    die "GOOGLE_CALENDAR_ICAL_URL deve começar com https://"
  fi
}

validate_port() {
  local value="${ENV_VALUES[PORT]:-}"
  [[ -z "$value" ]] && return 0
  if [[ ! "$value" =~ ^[0-9]+$ ]] || [[ "$value" -lt 1 || "$value" -gt 65535 ]]; then
    die "PORT deve ser um número entre 1 e 65535."
  fi
}

maybe_sync_gh_token() {
  if [[ -n "${ENV_VALUES[GH_TOKEN]:-}" ]]; then
    info "GH_TOKEN já presente no ambiente${DIM} ($(mask_secret "${ENV_VALUES[GH_TOKEN]}"))${RESET}"
    if prompt_yn "Manter este token?" "y"; then
      return 0
    fi
    unset 'ENV_VALUES[GH_TOKEN]'
  fi

  if command -v gh >/dev/null 2>&1 && gh auth status >/dev/null 2>&1; then
    info "GitHub CLI autenticado neste host."
    tip "Recomendado: usa o mesmo OAuth do \`gh auth login\` (melhor acesso a orgs)."
    if prompt_yn "Usar token de 'gh auth login'?" "y"; then
      ENV_VALUES[GH_TOKEN]="$(gh auth token)"
      success "GH_TOKEN obtido via gh auth token"
      return 0
    fi
  elif command -v gh >/dev/null 2>&1; then
    tip "\`gh\` instalado, mas sem login. Rode: ${BOLD}gh auth login${RESET}${DIM} e reinstale, ou cole um PAT."
  else
    tip "Sem GitHub CLI. Instale em ${UNDERLINE}${CYAN}${URL_GH_CLI}${RESET}${DIM} ou use um PAT."
  fi
}

collect_github() {
  section "GitHub ${DIM}(obrigatório — monitor de PRs)${RESET}"
  help_block "Onde obter" \
    "Melhor caminho: gh auth login no host, depois este wizard sincroniza." \
    "Alternativa: Personal Access Token (classic ou fine-grained + SSO da org)."
  link_hint "Criar PAT" "$URL_GH_TOKEN"
  link_hint "Instalar gh" "$URL_GH_CLI"
  echo

  maybe_sync_gh_token
  if [[ -z "${ENV_VALUES[GH_TOKEN]:-}" ]]; then
    prompt_secret GH_TOKEN "GH_TOKEN" required
  fi

  echo
  tip "Lista inicial de repos. Depois dá para editar em Devtools → Repositórios."
  prompt_value MONITORED_REPOSITORIES "Repositórios (owner/repo, vírgula)" required
  validate_monitored_repositories
}

collect_gemini() {
  section "Gemini ${DIM}(recomendado — resumos, briefing, corpo de PR)${RESET}"
  help_block "Onde obter" \
    "Crie uma API key no Google AI Studio (conta Google)."
  link_hint "API key" "$URL_GEMINI"
  echo

  if prompt_yn "Configurar Gemini agora?" "y"; then
    prompt_secret GEMINI_API_KEY "GEMINI_API_KEY" required
    tip "Padrão do app: gemini-2.5-flash — Enter deixa o padrão."
    prompt_value GEMINI_MODEL "GEMINI_MODEL" optional
    tip "Fallbacks separados por vírgula, usados se o principal retornar 503."
    prompt_value GEMINI_MODEL_FALLBACK "GEMINI_MODEL_FALLBACK" optional
  else
    unset 'ENV_VALUES[GEMINI_API_KEY]'
    unset 'ENV_VALUES[GEMINI_MODEL]'
    unset 'ENV_VALUES[GEMINI_MODEL_FALLBACK]'
    warn "Sem Gemini: resumos, briefing e geração de corpo de PR ficam indisponíveis."
  fi
}

collect_jira() {
  section "Jira ${DIM}(recomendado — tickets, sprints, cache)${RESET}"
  help_block "Onde obter" \
    "API token Atlassian vinculado ao e-mail da conta." \
    "Site padrão Jusfy: https://jusfy.atlassian.net"
  link_hint "API tokens" "$URL_JIRA_TOKEN"
  echo

  if prompt_yn "Configurar Jira agora?" "y"; then
    prompt_value JIRA_EMAIL "JIRA_EMAIL" required
    prompt_secret JIRA_TOKEN "JIRA_TOKEN" required
    tip "Opcional — Enter usa os padrões Jusfy (site + projeto JOR)."
    prompt_value JIRA_SITE_URL "JIRA_SITE_URL" optional
    prompt_value JIRA_SPRINT_PROJECT_KEY "JIRA_SPRINT_PROJECT_KEY" optional
    prompt_value JIRA_SPRINT_BOARD_ID "JIRA_SPRINT_BOARD_ID" optional
    validate_email
  else
    unset 'ENV_VALUES[JIRA_EMAIL]'
    unset 'ENV_VALUES[JIRA_TOKEN]'
    unset 'ENV_VALUES[JIRA_SITE_URL]'
    unset 'ENV_VALUES[JIRA_SPRINT_PROJECT_KEY]'
    unset 'ENV_VALUES[JIRA_SPRINT_BOARD_ID]'
    warn "Sem Jira: módulo /jira e sync de tickets ficam indisponíveis."
  fi
}

collect_calendar() {
  section "Google Calendar ${DIM}(opcional — eventos do dia no dashboard)${RESET}"
  help_block "Onde obter" \
    "Google Agenda → Configurações da agenda → Integrar agenda" \
    "→ Endereço secreto no formato iCal (.ics). Não compartilhe a URL."
  link_hint "Ajuda Google" "$URL_GCAL_HELP"
  echo

  if prompt_yn "Configurar calendário (iCal secreto)?" "n"; then
    prompt_secret GOOGLE_CALENDAR_ICAL_URL "GOOGLE_CALENDAR_ICAL_URL" required
    validate_ical_url
  else
    unset 'ENV_VALUES[GOOGLE_CALENDAR_ICAL_URL]'
    tip "Widget de eventos do dia mostrará estado vazio até configurar."
  fi
}

collect_slack() {
  section "Slack ${DIM}(opcional — compartilhar PR no canal)${RESET}"
  help_block "Onde obter" \
    "Crie/abra um Slack App → OAuth & Permissions → Bot User OAuth Token." \
    "Escopo necessário: chat:write. Convide o bot ao canal."
  link_hint "Slack Apps" "$URL_SLACK_APPS"
  echo

  if prompt_yn "Configurar Slack agora?" "n"; then
    prompt_secret SLACK_BOT_OAUTH_TOKEN "SLACK_BOT_OAUTH_TOKEN" required
    tip "Padrão do app: squad-jornada-pr"
    prompt_value SLACK_PR_CHANNEL "SLACK_PR_CHANNEL" optional
  else
    unset 'ENV_VALUES[SLACK_BOT_OAUTH_TOKEN]'
    unset 'ENV_VALUES[SLACK_PR_CHANNEL]'
  fi
}

collect_preferences() {
  section "Preferências ${DIM}(opcional)${RESET}"
  tip "Nível de carreira orienta o tom dos resumos (padrão: junior)."
  if prompt_yn "Definir SUMMARY_CAREER_LEVEL?" "n"; then
    prompt_choice SUMMARY_CAREER_LEVEL "Nível" optional junior pleno senior
  fi

  echo
  tip "Porta HTTP do app no host (padrão 3847). Compose já mapeia \${PORT}:3847."
  if prompt_yn "Alterar PORT?" "n"; then
    prompt_value PORT "PORT" required
    validate_port
  else
    ENV_VALUES[PORT]="${ENV_VALUES[PORT]:-3847}"
  fi
}

collect_local_docker_note() {
  section "Ambiente local Jusfy ${DIM}(Devtools — só no host / npm run dev)${RESET}"
  tip "LOCAL_DOCKER_ROOT e JUSFY_ROOT não são injetados no container Docker do PR Flow."
  tip "Configure no .env depois se for usar Devtools → Ambiente local com \`npm run dev\`."
  tip "Variáveis: LOCAL_DOCKER_ROOT, JUSFY_ROOT, LOCAL_DOCKER_PORTAINER_URL"
}

print_config_summary() {
  section "Resumo da configuração"

  local status_gh status_gemini status_jira status_cal status_slack

  [[ -n "${ENV_VALUES[GH_TOKEN]:-}" ]] && status_gh="${icon_ok}" || status_gh="${icon_fail}"
  [[ -n "${ENV_VALUES[GEMINI_API_KEY]:-}" ]] && status_gemini="${icon_ok}" || status_gemini="${icon_skip}"
  [[ -n "${ENV_VALUES[JIRA_TOKEN]:-}" ]] && status_jira="${icon_ok}" || status_jira="${icon_skip}"
  [[ -n "${ENV_VALUES[GOOGLE_CALENDAR_ICAL_URL]:-}" ]] && status_cal="${icon_ok}" || status_cal="${icon_skip}"
  [[ -n "${ENV_VALUES[SLACK_BOT_OAUTH_TOKEN]:-}" ]] && status_slack="${icon_ok}" || status_slack="${icon_skip}"

  echo -e "  ${status_gh}  GitHub          ${DIM}$(mask_secret "${ENV_VALUES[GH_TOKEN]:-}")${RESET}"
  echo -e "      ${GRAY}repos${RESET}         ${ENV_VALUES[MONITORED_REPOSITORIES]:-}"
  echo -e "  ${status_gemini}  Gemini          ${DIM}$(mask_secret "${ENV_VALUES[GEMINI_API_KEY]:-}")${RESET}"
  echo -e "  ${status_jira}  Jira            ${DIM}${ENV_VALUES[JIRA_EMAIL]:-(não configurado)}${RESET}"
  echo -e "  ${status_cal}  Google Calendar ${DIM}$([[ -n "${ENV_VALUES[GOOGLE_CALENDAR_ICAL_URL]:-}" ]] && echo configurado || echo não configurado)${RESET}"
  echo -e "  ${status_slack}  Slack           ${DIM}$([[ -n "${ENV_VALUES[SLACK_BOT_OAUTH_TOKEN]:-}" ]] && echo configurado || echo não configurado)${RESET}"
  echo -e "  ${icon_dot}  PORT            ${ENV_VALUES[PORT]:-3847}"
  if [[ -n "${ENV_VALUES[SUMMARY_CAREER_LEVEL]:-}" ]]; then
    echo -e "  ${icon_dot}  Career level    ${ENV_VALUES[SUMMARY_CAREER_LEVEL]}"
  fi
  echo
  tip "O banco é um arquivo SQLite (data/pr-flow.sqlite). O Compose monta ./data no container."
  echo
}

collect_env_values() {
  collect_github
  collect_gemini
  collect_jira
  collect_calendar
  collect_slack
  collect_preferences
  collect_local_docker_note
  print_config_summary

  if ! prompt_yn "Gravar .env com esta configuração?" "y"; then
    die "Instalação cancelada — nenhum arquivo foi alterado."
  fi
}

write_env_file() {
  [[ -f "$example_file" ]] || die "Arquivo .env.example não encontrado em $root"

  local tmp
  tmp="$(mktemp)"

  while IFS= read -r line || [[ -n "$line" ]]; do
    if [[ "$line" =~ ^#[[:space:]]*([A-Za-z_][A-Za-z0-9_]*)=(.*)$ ]]; then
      local ckey="${BASH_REMATCH[1]}"
      if [[ -n "${ENV_VALUES[$ckey]:-}" ]]; then
        printf '%s=%s\n' "$ckey" "${ENV_VALUES[$ckey]}"
        continue
      fi
      printf '%s\n' "$line"
      continue
    fi

    if [[ "$line" =~ ^([A-Za-z_][A-Za-z0-9_]*)= ]]; then
      local key="${BASH_REMATCH[1]}"
      if [[ -n "${ENV_VALUES[$key]+x}" ]]; then
        printf '%s=%s\n' "$key" "${ENV_VALUES[$key]}"
      else
        printf '%s\n' "$line"
      fi
    else
      printf '%s\n' "$line"
    fi
  done <"$example_file" >"$tmp"

  # Anexa chaves do wizard que ainda não existam no arquivo gerado
  local key
  for key in \
    GEMINI_MODEL_FALLBACK \
    SUMMARY_CAREER_LEVEL \
    JIRA_SPRINT_BOARD_ID \
    GOOGLE_CALENDAR_ICAL_URL \
    PORT
  do
    if [[ -n "${ENV_VALUES[$key]:-}" ]] && ! grep -qE "^#?[[:space:]]*${key}=" "$tmp"; then
      printf '%s=%s\n' "$key" "${ENV_VALUES[$key]}" >>"$tmp"
    fi
  done

  mv "$tmp" "$env_file"
  chmod 600 "$env_file" 2>/dev/null || true
}

check_item() {
  local label="$1"
  shift

  printf "  ${DIM}…${RESET} %-28s" "$label"
  if "$@" >/dev/null 2>&1; then
    printf "\r  ${icon_ok} %-28s ${GREEN}ok${RESET}\n" "$label"
    return 0
  fi

  printf "\r  ${icon_fail} %-28s ${RED}falhou${RESET}\n" "$label"
  return 1
}

check_prerequisites() {
  step_header "Verificando pré-requisitos"

  check_item "Docker instalado" command -v docker || die "Instale Docker antes de continuar."
  check_item "Docker Compose" docker compose version || die "Instale o plugin Docker Compose."
  check_item "Docker em execução" docker info || die "Inicie o daemon Docker ou verifique permissões do usuário."

  if command -v gh >/dev/null 2>&1; then
    if gh auth status >/dev/null 2>&1; then
      success "GitHub CLI autenticado (opcional, facilita GH_TOKEN)"
    else
      info "GitHub CLI presente, sem login ${DIM}(gh auth login)${RESET}"
    fi
  else
    info "GitHub CLI não encontrado ${DIM}(opcional — ${URL_GH_CLI})${RESET}"
  fi

  success "Ambiente pronto para instalação"
}

configure_env() {
  step_header "Configurando variáveis de ambiente"

  if [[ -f "$env_file" ]]; then
    info "Arquivo .env encontrado em ${BOLD}${env_file}${RESET}"
    if ! prompt_yn "Reconfigurar variáveis?" "n"; then
      success "Mantendo .env atual"
      # Recarrega PORT para mensagem final
      load_existing_env
      return 0
    fi
  else
    info "Nenhum .env encontrado — vamos criar um novo"
  fi

  echo
  collect_env_values
  write_env_file
  echo
  success ".env salvo em ${BOLD}${env_file}${RESET}"
}

verify_env_completeness() {
  step_header "Checando cobertura do .env"

  load_existing_env

  local missing_core=0
  local missing_rec=0

  if [[ -z "${ENV_VALUES[GH_TOKEN]:-}" ]]; then
    warn "Falta GH_TOKEN — monitor de PRs não funciona no Docker."
    link_hint "PAT" "$URL_GH_TOKEN"
    missing_core=1
  else
    success "GH_TOKEN"
  fi

  if [[ -z "${ENV_VALUES[MONITORED_REPOSITORIES]:-}" ]]; then
    warn "Falta MONITORED_REPOSITORIES — seed inicial de repos vazio."
    missing_core=1
  else
    success "MONITORED_REPOSITORIES"
  fi

  if [[ -z "${ENV_VALUES[GEMINI_API_KEY]:-}" ]]; then
    warn "Sem GEMINI_API_KEY — resumos / briefing / corpo de PR desligados."
    link_hint "API key" "$URL_GEMINI"
    missing_rec=1
  else
    success "GEMINI_API_KEY"
  fi

  if [[ -z "${ENV_VALUES[JIRA_EMAIL]:-}" || -z "${ENV_VALUES[JIRA_TOKEN]:-}" ]]; then
    warn "Sem Jira — módulo /jira e sync de tickets desligados."
    link_hint "API tokens" "$URL_JIRA_TOKEN"
    missing_rec=1
  else
    success "Jira (email + token)"
  fi

  if [[ -z "${ENV_VALUES[GOOGLE_CALENDAR_ICAL_URL]:-}" ]]; then
    info "Google Calendar não configurado ${DIM}(widget do dashboard)${RESET}"
  else
    success "GOOGLE_CALENDAR_ICAL_URL"
  fi

  if [[ -z "${ENV_VALUES[SLACK_BOT_OAUTH_TOKEN]:-}" ]]; then
    info "Slack não configurado ${DIM}(compartilhar PR)${RESET}"
  else
    success "Slack"
  fi

  tip "Compose usa SQLite em ./data. A revisão local de PRs roda no host (npm), onde o Claude Code está instalado."

  if [[ "$missing_core" -eq 1 ]]; then
    echo
    if ! prompt_yn "Há lacunas essenciais. Continuar o build mesmo assim?" "n"; then
      die "Corrija o .env e rode de novo: npm run install:docker"
    fi
  elif [[ "$missing_rec" -eq 1 ]]; then
    echo
    tip "Integrações recomendadas faltando — o core de PRs sobe; features de IA/Jira ficam limitadas."
  else
    success "Cobertura ok para o funcionamento completo do app"
  fi
}

build_image() {
  step_header "Construindo imagem Docker"

  info "Isso pode levar alguns minutos na primeira vez…"
  echo

  if (cd "$root" && docker compose build app); then
    echo
    success "Imagem do app construída com sucesso"
  else
    die "Falha ao construir a imagem. Verifique os logs acima."
  fi
}

print_finish() {
  local port="${ENV_VALUES[PORT]:-3847}"

  step_header "Pronto!"

  echo -e "  ${GREEN}${BOLD}Instalação concluída${RESET}"
  echo
  echo -e "  ${WHITE}${BOLD}Próximos passos${RESET}"
  echo -e "  ${icon_dot} Subir o stack:  ${CYAN}${BOLD}docker compose up -d${RESET}"
  echo -e "  ${icon_dot} Ver logs:       ${DIM}docker compose logs -f app${RESET}"
  echo -e "  ${icon_dot} Sync GH token:  ${DIM}npm run gh:sync-env${RESET}  ${GRAY}(se renovar o login gh)${RESET}"
  echo
  echo -e "  ${WHITE}${BOLD}URLs${RESET}"
  echo -e "  ${icon_dot} App:     ${ORANGE}${BOLD}http://localhost:${port}${RESET}"
  echo
  echo -e "  ${WHITE}${BOLD}Credenciais (atalhos)${RESET}"
  echo -e "  ${icon_link} Gemini   ${DIM}${URL_GEMINI}${RESET}"
  echo -e "  ${icon_link} Jira     ${DIM}${URL_JIRA_TOKEN}${RESET}"
  echo -e "  ${icon_link} GitHub   ${DIM}${URL_GH_TOKEN}${RESET}"
  echo
}

main() {
  if [[ -t 1 ]]; then
    clear 2>/dev/null || true
  fi

  print_banner
  check_prerequisites
  load_existing_env
  configure_env
  verify_env_completeness
  build_image
  print_finish
}

main "$@"
