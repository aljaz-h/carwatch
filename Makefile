.PHONY: up down restart logs status update backup restore secrets install

up:
	docker compose up -d --build

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
	docker compose up -d --build

backup:
	./scripts/backup.sh

restore:
	./scripts/restore.sh $(FILE)

secrets:
	./scripts/generate-secrets.sh

install:
	./scripts/install.sh
