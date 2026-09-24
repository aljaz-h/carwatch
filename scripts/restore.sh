#!/usr/bin/env bash
# Restores a CarWatch Postgres database from a backup made by backup.sh.
# This REPLACES all current data in the database.
#
# Usage: ./scripts/restore.sh backups/carwatch-20260101-120000.sql.gz
set -euo pipefail
cd "$(dirname "$0")/.."

file=${1:-}
if [ -z "$file" ] || [ ! -f "$file" ]; then
  echo "Usage: $0 <path-to-backup.sql.gz>" >&2
  echo "Available backups:" >&2
  ls -1 backups/*.sql.gz 2>/dev/null >&2 || echo "  (none found in ./backups)" >&2
  exit 1
fi

if [ ! -f .env ]; then
  echo "Error: .env not found. Run this from the CarWatch repo root after setup." >&2
  exit 1
fi

# shellcheck disable=SC1091
set -a; source .env; set +a
POSTGRES_USER=${POSTGRES_USER:-carwatch}
POSTGRES_DB=${POSTGRES_DB:-carwatch}

if ! docker compose ps postgres --format '{{.Health}}' 2>/dev/null | grep -q healthy; then
  echo "Error: the postgres service is not running/healthy. Run: docker compose up -d" >&2
  exit 1
fi

echo "This will REPLACE all data in the '${POSTGRES_DB}' database with the contents of:"
echo "  ${file}"
read -r -p "Type 'yes' to continue: " confirm
if [ "$confirm" != "yes" ]; then
  echo "Aborted."
  exit 1
fi

echo "Stopping web and worker so nothing writes to the database during restore ..."
docker compose stop web worker

echo "Restoring ..."
gunzip -c "$file" | docker compose exec -T postgres psql -U "$POSTGRES_USER" -d "$POSTGRES_DB"

echo "Restarting web and worker ..."
docker compose start web worker

echo "Done."
