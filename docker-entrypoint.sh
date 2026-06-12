#!/bin/sh
set -e

postgres_host="${DATABASE_URL#*@}"
postgres_host="${postgres_host%%/*}"
postgres_host="${postgres_host%%:*}"

if [ -n "$postgres_host" ]; then
  echo "Waiting for PostgreSQL at ${postgres_host}..."
  until pg_isready -h "$postgres_host" -U prflow -d prflow >/dev/null 2>&1; do
    sleep 1
  done
fi

echo "Running database migrations..."
node scripts/migrate.mjs

export PR_FLOW_GH_LOG_DIR="${PR_FLOW_GH_LOG_DIR:-/tmp/pr-flow/logs}"
mkdir -p "$PR_FLOW_GH_LOG_DIR"

echo "Starting pr-flow on port ${PORT:-3847}..."
exec node server.js
