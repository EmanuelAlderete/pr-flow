#!/usr/bin/env bash
set -euo pipefail

root="$(cd "$(dirname "$0")/.." && pwd)"
env_file="${1:-$root/.env}"

if ! command -v gh >/dev/null 2>&1; then
  echo "GitHub CLI (gh) is required. Install it and run: gh auth login" >&2
  exit 1
fi

token="$(gh auth token)"
tmp="$(mktemp)"

if [[ -f "$env_file" ]]; then
  updated=0
  while IFS= read -r line || [[ -n "$line" ]]; do
    if [[ "$line" == GH_TOKEN=* ]]; then
      printf 'GH_TOKEN=%s\n' "$token"
      updated=1
    else
      printf '%s\n' "$line"
    fi
  done <"$env_file" >"$tmp"
  if [[ "$updated" -eq 0 ]]; then
    printf 'GH_TOKEN=%s\n' "$token" >>"$tmp"
  fi
else
  printf 'GH_TOKEN=%s\n' "$token" >"$tmp"
fi

mv "$tmp" "$env_file"
chmod 600 "$env_file" 2>/dev/null || true

echo "Updated GH_TOKEN in $env_file from local \`gh auth token\`."
echo "Restart Docker if it is running: docker compose up -d --build"
