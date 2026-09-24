#!/usr/bin/env bash
# Fills in the required secret(s) in .env, without touching anything else.
#
# Usage: ./scripts/generate-secrets.sh
set -euo pipefail
cd "$(dirname "$0")/.."

if [ ! -f .env ]; then
  if [ ! -f .env.example ]; then
    echo "Error: neither .env nor .env.example found. Run this from the CarWatch repo root." >&2
    exit 1
  fi
  cp .env.example .env
  echo "Created .env from .env.example."
fi

if ! command -v openssl >/dev/null 2>&1; then
  echo "Error: openssl is required to generate secrets but was not found." >&2
  exit 1
fi

set_secret() {
  local key="$1"
  local current
  current=$(grep -E "^${key}=" .env | head -n1 | cut -d= -f2- || true)
  if [ -n "$current" ]; then
    echo "  ${key} is already set — leaving it as-is."
    return
  fi
  local value
  value=$(openssl rand -hex 32)
  if grep -qE "^${key}=" .env; then
    # Portable in-place edit for both GNU and BSD sed.
    sed -i.bak "s|^${key}=.*|${key}=${value}|" .env && rm -f .env.bak
  else
    printf '%s=%s\n' "$key" "$value" >> .env
  fi
  echo "  ${key} generated."
}

echo "Generating secrets in .env ..."
set_secret POSTGRES_PASSWORD
echo "Done. Review .env, then run: docker compose up -d --build"
