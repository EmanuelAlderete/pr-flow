#!/bin/sh
set -e

echo "Running database migrations..."
node scripts/migrate.mjs

export PR_FLOW_GH_LOG_DIR="${PR_FLOW_GH_LOG_DIR:-/tmp/pr-flow/logs}"
mkdir -p "$PR_FLOW_GH_LOG_DIR"

echo "Starting pr-flow on port ${PORT:-3847}..."
exec node server.js
