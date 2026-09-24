.PHONY: up down restart logs status update backup restore secrets install pull dev dev-down

# Production (default): pull prebuilt GHCR images, no local build.
up:
	docker compose pull
	docker compose up -d

pull:
	docker compose pull

down:
	docker compose down

restart:
	docker compose restart

logs:
	docker compose logs -f

status:
	docker compose ps

update:
	git pull
	docker compose pull
	docker compose up -d

backup:
	./scripts/backup.sh

restore:
	./scripts/restore.sh $(FILE)

secrets:
	./scripts/generate-secrets.sh

install:
	./scripts/install.sh

# Development: build CarWatch from source instead of pulling from GHCR.
# See docker-compose.dev.yml.
dev:
	docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d --build

dev-down:
	docker compose -f docker-compose.yml -f docker-compose.dev.yml down
