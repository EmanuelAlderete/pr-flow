#!/usr/bin/env bash
set -euo pipefail

root="$(cd "$(dirname "$0")/.." && pwd)"
env_file="$root/.env"
example_file="$root/.env.example"

declare -A ENV_VALUES=()
STEP=0
STEP_TOTAL=4

if [[ -t 1 ]]; then
  RESET=$'\033[0m'
  BOLD=$'\033[1m'
  DIM=$'\033[2m'
  RED=$'\033[31m'
  GREEN=$'\033[32m'
  YELLOW=$'\033[33m'
  BLUE=$'\033[34m'
  CYAN=$'\033[36m'
  ORANGE=$'\033[38;5;208m'
  GRAY=$'\033[90m'
  WHITE=$'\033[97m'
else
  RESET=BOLD=DIM=RED=GREEN=YELLOW=BLUE=CYAN=ORANGE=GRAY=WHITE=''
fi

icon_ok="${GREEN}✓${RESET}"
icon_fail="${RED}✗${RESET}"
icon_arrow="${ORANGE}→${RESET}"
icon_dot="${ORANGE}●${RESET}"

die() {
  echo
  echo -e "  ${icon_fail} ${RED}${BOLD}Erro${RESET} ${DIM}—${RESET} $*"
  exit 1
}

print_banner() {
  echo
  echo -e "${ORANGE}${BOLD}"
  cat <<'EOF'
  ____  ____   _____ _
 |  _ \|  _ \ / ____| |
 | |_) | |_) | (___ | | _____      __
 |  __/|  _ < \___ \| |/ _ \ \ /\ / /
 | |   | |_) |____) | | (_) \ V  V /
 |_|   |____/|_____/|_|\___/ \_/\_/
EOF
  echo -e "${RESET}"
  echo -e "  ${WHITE}${BOLD}Instalador Docker${RESET} ${DIM}·${RESET} ${GRAY}configura o ambiente e builda a imagem${RESET}"
  echo
}

step_header() {
  local title="$1"
  STEP=$((STEP + 1))
  echo
  echo -e "${CYAN}${BOLD}━━━ Etapa ${STEP}/${STEP_TOTAL}${RESET} ${WHITE}${BOLD}${title}${RESET} ${CYAN}━━━${RESET}"
  echo
}

section() {
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

require_docker_compose() {
  if ! docker compose version >/dev/null 2>&1; then
    die "Docker Compose não encontrado. Instale o plugin compose antes de continuar."
  fi
}

load_existing_env() {
  [[ -f "$env_file" ]] || return 0

  while IFS= read -r line || [[ -n "$line" ]]; do
    if [[ "$line" =~ ^([A-Za-z_][A-Za-z0-9_]*)=(.*)$ ]]; then
      ENV_VALUES["${BASH_REMATCH[1]}"]="${BASH_REMATCH[2]}"
    fi
  done <"$env_file"
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
      echo -e "    ${DIM}(pulado)${RESET}"
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
    hint=" ${DIM}(Enter mantém o valor atual)${RESET}"
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
      echo -e "    ${DIM}(pulado)${RESET}"
      return 0
    fi

    warn "Campo obrigatório. Tente novamente."
  done
}

validate_monitored_repositories() {
  local value="${ENV_VALUES[MONITORED_REPOSITORIES]:-}"
  if [[ ! "$value" =~ ^[^/,[:space:]]+/[^/,[:space:]]+ ]]; then
    die "MONITORED_REPOSITORIES deve listar repos no formato owner/repo (ex.: jusfy/app-1,jusfy/app-2)."
  fi
}

maybe_sync_gh_token() {
  if [[ -n "${ENV_VALUES[GH_TOKEN]:-}" ]]; then
    return 0
  fi

  if ! command -v gh >/dev/null 2>&1; then
    return 0
  fi

  if ! gh auth status >/dev/null 2>&1; then
    return 0
  fi

  info "GitHub CLI detectado e autenticado."
  if prompt_yn "Usar token de 'gh auth login'?" "y"; then
    ENV_VALUES[GH_TOKEN]="$(gh auth token)"
    success "GH_TOKEN obtido via gh auth token"
  fi
}

write_env_file() {
  [[ -f "$example_file" ]] || die "Arquivo .env.example não encontrado em $root"

  local tmp
  tmp="$(mktemp)"

  while IFS= read -r line || [[ -n "$line" ]]; do
    if [[ "$line" =~ ^([A-Za-z_][A-Za-z0-9_]*)= ]]; then
      local key="${BASH_REMATCH[1]}"
      if [[ -n "${ENV_VALUES[$key]:-}" ]]; then
        printf '%s=%s\n' "$key" "${ENV_VALUES[$key]}"
      else
        printf '%s\n' "$line"
      fi
    else
      printf '%s\n' "$line"
    fi
  done <"$example_file" >"$tmp"

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

  success "Ambiente pronto para instalação"
}

collect_env_values() {
  section "GitHub"
  maybe_sync_gh_token
  prompt_secret GH_TOKEN "GH_TOKEN" required
  prompt_value MONITORED_REPOSITORIES "Repositórios monitorados (owner/repo, vírgula)" required
  validate_monitored_repositories

  echo
  section "Gemini (resumos e briefing)"
  prompt_secret GEMINI_API_KEY "GEMINI_API_KEY" required
  prompt_value GEMINI_MODEL "GEMINI_MODEL" optional

  echo
  section "Jira"
  prompt_value JIRA_EMAIL "JIRA_EMAIL" required
  prompt_secret JIRA_TOKEN "JIRA_TOKEN" required
  prompt_value JIRA_SITE_URL "JIRA_SITE_URL" optional
  prompt_value JIRA_SPRINT_PROJECT_KEY "JIRA_SPRINT_PROJECT_KEY" optional

  echo
  section "Slack (opcional)"
  prompt_secret SLACK_BOT_OAUTH_TOKEN "SLACK_BOT_OAUTH_TOKEN" optional
  prompt_value SLACK_PR_CHANNEL "SLACK_PR_CHANNEL" optional
}

configure_env() {
  step_header "Configurando variáveis de ambiente"

  if [[ -f "$env_file" ]]; then
    info "Arquivo .env encontrado em ${BOLD}${env_file}${RESET}"
    if ! prompt_yn "Reconfigurar variáveis?" "n"; then
      success "Mantendo .env atual"
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
  echo
  echo -e "  ${WHITE}${BOLD}URLs${RESET}"
  echo -e "  ${icon_dot} App:     ${ORANGE}${BOLD}http://localhost:${port}${RESET}"
  echo -e "  ${icon_dot} Grafana: ${ORANGE}${BOLD}http://localhost:3848${RESET}  ${DIM}(admin / prflow)${RESET}"
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
  build_image
  print_finish
}

main "$@"
