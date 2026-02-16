#!/usr/bin/env bash
set -euo pipefail

# Simple helper to start the Postgres container and seed test data.
# Usage: from repo root, run: ./setup/seed.sh

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
COMPOSE_FILE="$SCRIPT_DIR/docker-compose.yml"

echo "[seed] Starting database container (if not already running)..."
docker-compose -f "$COMPOSE_FILE" up -d db

# Give Postgres a moment to accept connections
sleep 5

echo "[seed] Seeding database with test users and cars..."
cat "$SCRIPT_DIR/seed.sql" | docker-compose -f "$COMPOSE_FILE" exec -T db psql \
  -U racer \
  -d racer \
  -v ON_ERROR_STOP=1

echo "[seed] Done. You can now query the 'users' and 'cars' tables."
