#!/usr/bin/env bash
# Dumps the CarWatch Postgres database to a timestamped, gzipped file in
# ./backups/. Redis holds no data worth backing up (queue/cache only) —
# Postgres is CarWatch's only source of truth.
#
# Usage: ./scripts/backup.sh
set -euo pipefail
cd "$(dirname "$0")/.."

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

mkdir -p backups
timestamp=$(date -u +%Y%m%d-%H%M%S)
out="backups/carwatch-${timestamp}.sql.gz"

echo "Backing up database '${POSTGRES_DB}' to ${out} ..."
docker compose exec -T postgres pg_dump --clean --if-exists -U "$POSTGRES_USER" "$POSTGRES_DB" | gzip > "$out"

size=$(du -h "$out" | cut -f1)
echo "Done: ${out} (${size})"
