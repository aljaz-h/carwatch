#!/usr/bin/env bash
# One-shot helper that gets CarWatch running on a fresh VPS: checks
# prerequisites, prepares .env, generates secrets, then pulls the prebuilt
# CarWatch images from GHCR and starts the stack — nothing is compiled on
# this machine. It never installs Docker itself and never touches the
# firewall — see the README if you need to do either of those.
#
# Usage: ./scripts/install.sh
set -euo pipefail
cd "$(dirname "$0")/.."

echo "== CarWatch install =="

if ! command -v docker >/dev/null 2>&1; then
  cat >&2 <<'EOF'
Error: docker was not found on this machine.

CarWatch runs on Docker + Docker Compose. Install Docker Engine first, then
re-run this script. See: https://docs.docker.com/engine/install/
EOF
  exit 1
fi

if ! docker compose version >/dev/null 2>&1; then
  cat >&2 <<'EOF'
Error: the "docker compose" plugin was not found (docker compose version failed).

Install the Docker Compose plugin, then re-run this script. See:
https://docs.docker.com/compose/install/
EOF
  exit 1
fi

if ! docker info >/dev/null 2>&1; then
  cat >&2 <<'EOF'
Error: the Docker daemon is not reachable.

It may not be running, or this user may not have permission to talk to it
(try running with sudo, or add your user to the "docker" group and re-login).
EOF
  exit 1
fi

echo "Docker and Docker Compose look good."

if [ -f .env ]; then
  echo ".env already exists — leaving it as-is."
else
  cp .env.example .env
  echo "Created .env from .env.example."
fi

./scripts/generate-secrets.sh

echo
echo "Pulling prebuilt CarWatch images from ghcr.io (no build, no Node.js needed) ..."
docker compose pull

echo
echo "Starting the CarWatch stack ..."
docker compose up -d

echo
echo "Waiting for the web app to become healthy ..."
attempts=0
until docker compose ps web --format '{{.Health}}' 2>/dev/null | grep -q healthy; do
  attempts=$((attempts + 1))
  if [ "$attempts" -ge 60 ]; then
    echo "Warning: web service did not report healthy after 5 minutes. Check: docker compose logs web" >&2
    break
  fi
  sleep 5
done

web_port=$(grep -E '^WEB_PORT=' .env | head -n1 | cut -d= -f2- || true)
web_port=${web_port:-3000}

cat <<EOF

CarWatch is up.

  Open: http://localhost:${web_port}

If this is a fresh install, you'll land on a one-time setup screen to create
the administrator account. If something looks wrong, check:

  docker compose ps
  docker compose logs -f
EOF
