# CarWatch

A self-hosted used-car listing aggregator and monitoring platform. CarWatch collects
listings from multiple marketplaces (Avto.net, DoberAvto, Bolha, mobile.de, and more
over time), normalizes them into one consistent model, and lets you search, save
searches, watch individual listings, and get alerted on new matches, price drops, and
listings coming back on the market.

## Quick Start (Docker Compose)

Requires a VPS or machine running Ubuntu 22.04+/24.04+ or Debian 12+ with
[Docker Engine and the Docker Compose plugin](https://docs.docker.com/engine/install/)
installed. Nothing else — no Node, pnpm, Postgres, or Redis install required.

```bash
git clone https://github.com/<your-fork>/carwatch.git
cd carwatch

cp .env.example .env
./scripts/generate-secrets.sh   # fills in POSTGRES_PASSWORD; see below for the manual equivalent

docker compose up -d --build

docker compose ps               # everything should show "healthy" within a minute or two
```

Then open `http://<your-server-ip>:3000` (or `http://localhost:3000` on your own
machine). The first time you open it you'll land on a one-time **setup screen** to
create the administrator account — CarWatch ships with no default admin/admin
credentials. Once that account exists, the setup screen is disabled.

Prefer to generate the secret yourself instead of running the script?

```bash
openssl rand -hex 32   # paste the output as POSTGRES_PASSWORD in .env
```

See [Reverse proxy & HTTPS](#reverse-proxy--https) once you're ready to put CarWatch
behind a real domain.

## Architecture

```
apps/
  web/            Next.js app (browse, listing detail, saved searches, watchlist,
                   dashboard, settings). Reads the database directly via Server
                   Components; mutations go through Server Actions.
  worker/         Long-running Node process. BullMQ queues drive scraping,
                   normalization, saved-search matching, and alert delivery.

packages/
  database/       Prisma schema + generated client + seed scripts. The single
                   source of truth for the data model (Vehicle vs. Listing,
                   price/status/mileage history, saved searches, alerts, ...).
  shared/         Framework-agnostic types, the deterministic match-scoring
                   engine, filter criteria types, and the queue/job contracts
                   shared between the web app and the worker.
  providers/      The marketplace provider interface (searchListings /
                   getListing / normalizeListing / healthCheck), an HTTP layer
                   with rate limiting + retry/backoff, and provider
                   implementations (Avto.net via Cheerio, a network-free Demo
                   provider for local development).
  notifications/  Notification channel interface + Discord webhook and Email
                   implementations, plus alert payload builders.
```

**Why this split:** the web app and worker never talk to a marketplace directly —
they only know about `packages/providers`' `Provider` interface and the
`ProviderRegistry`. Adding a new marketplace means writing a new provider module
and registering it in `packages/providers/src/default-registry.ts`; nothing else
in the app changes. Similarly, adding a new alert channel (Telegram, ntfy,
Gotify, web push) means adding a class in `packages/notifications/src/channels`
and a case in `buildChannel` — the rest of the alert pipeline is unaware of the
concrete channel.

A **Vehicle** (the physical car/spec) is a separate model from a **Listing** (an
advertisement for it on one marketplace). Price, status, and mileage changes are
recorded as append-only history rather than overwritten, so a listing's story
over time is never lost. When the same physical car shows up on more than one
marketplace, `DuplicateMatch` links the two listings with a confidence score
instead of silently merging them.

The web app never runs scraping itself — a "Run now" click in Settings →
Providers enqueues a BullMQ job on Redis; only the worker process ever
executes provider code. The web app reads job/queue state to show live
status, but nothing scrapes inside an HTTP request.

## Providers

Out of the box:

- **Avto.net** — real HTTP + Cheerio scraping, rate-limited and retried with
  exponential backoff + jitter (`packages/providers/src/providers/avto-net`).
  Parser tests run against stored HTML fixtures in `packages/providers/test/fixtures`,
  including fixtures for a changed page structure, so a parser mismatch fails a
  test instead of silently returning zero listings.
- **Demo Marketplace** — an in-memory, network-free provider used as a safe
  default so the full scrape → normalize → match → alert pipeline can be
  exercised without hitting any real site.

DoberAvto, Bolha, and mobile.de exist as `Provider` rows in the seed data
(so their diagnostics/settings UI has something real to show) but don't yet
have a scraping implementation — the worker logs and marks them `DISABLED`
rather than crashing when it can't find one. Adding a real implementation is
the same shape as `avto-net`: fetch → parse with Cheerio (or Playwright, for
providers whose search results require JS rendering) → normalize to the
shared `NormalizedListing`/`NormalizedVehicle` shape → register in
`default-registry.ts`.

**Settings → Providers** is CarWatch's diagnostics surface, not just an on/off
switch: per-provider health state, last successful/attempted run, run
duration, discovered/new/updated/unchanged listing counts, the latest error
in plain language (with a collapsible "Advanced details" section for the
technical error type/HTTP status/job id), a manual "Run now" trigger, and a
filterable run-history log. It polls for updates every few seconds while
you're on the page — refresh isn't required.

## Reverse proxy & HTTPS

`docker compose up` exposes the web app on `WEB_PORT` (default `3000`) on the
host. That's enough to use CarWatch locally or over a VPN. To put it behind a
real domain with HTTPS, run a reverse proxy in front of that port — CarWatch
doesn't need to know about TLS at all. Any of these work well:

- **[Nginx Proxy Manager](https://nginxproxymanager.com/)** — easiest if you
  want a UI: point a Proxy Host at `http://<server-ip>:3000` (or `web:3000` if
  you run NPM in the same Docker network) and request a Let's Encrypt
  certificate from its "SSL" tab.
- **Plain Nginx** — a minimal server block:

  ```nginx
  server {
      listen 443 ssl;
      server_name carwatch.example.com;

      ssl_certificate     /etc/letsencrypt/live/carwatch.example.com/fullchain.pem;
      ssl_certificate_key /etc/letsencrypt/live/carwatch.example.com/privkey.pem;

      location / {
          proxy_pass http://127.0.0.1:3000;
          proxy_set_header Host $host;
          proxy_set_header X-Real-IP $remote_addr;
          proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
          proxy_set_header X-Forwarded-Proto $scheme;
      }
  }
  ```

  Get the certificate with [Certbot](https://certbot.eff.org/) (`certbot --nginx`).

- **[Caddy](https://caddyserver.com/)** — a two-line Caddyfile handles TLS
  automatically:

  ```
  carwatch.example.com {
      reverse_proxy localhost:3000
  }
  ```

None of these are required to run CarWatch — only to reach it securely over the
public internet under a real domain.

## Backups & restore

Postgres is CarWatch's only source of truth — Redis just holds in-flight job
queue state and can be safely wiped (the worker rebuilds its schedules on
startup). Both are stored in named Docker volumes (`carwatch_postgres-data`,
`carwatch_redis-data`) that survive `docker compose down` and VPS reboots, and
are only removed by an explicit `docker compose down -v`.

```bash
./scripts/backup.sh
# Backing up database 'carwatch' to backups/carwatch-20260924-120000.sql.gz ...
# Done: backups/carwatch-20260924-120000.sql.gz (1.2M)
```

To restore (this replaces all current data):

```bash
./scripts/restore.sh backups/carwatch-20260924-120000.sql.gz
```

Consider scheduling `./scripts/backup.sh` with cron for unattended backups.

## Upgrading

```bash
git pull
docker compose up -d --build
```

Migrations run automatically on every `up` (the one-off `migrate` service runs
`prisma migrate deploy`, never `prisma db push`, before web/worker start), so
this is safe to run repeatedly. Verify afterward:

```bash
docker compose ps      # web, worker, postgres, redis all healthy
docker compose logs -f web worker   # Ctrl+C to stop following
```

## Useful commands

```bash
docker compose up -d --build   # start (or update) the stack
docker compose down            # stop everything, keep data
docker compose ps              # status + health of each service
docker compose logs -f         # follow logs (add a service name to filter)
docker compose restart worker  # restart just the worker
./scripts/backup.sh            # timestamped gzipped Postgres dump
./scripts/restore.sh <file>    # restore from a backup
```

An optional `Makefile` wraps the same commands (`make up`, `make down`,
`make logs`, `make status`, `make update`, `make backup`) if you prefer that —
everything is also reachable through plain `docker compose`/scripts, no
functionality is Makefile-only.

## Troubleshooting

**The site won't open at all.**
Check `docker compose ps` — every service should show `healthy` (postgres/redis/web)
or have exited 0 (the one-off `migrate` service, after it finishes). If `web`
is unhealthy or restarting, check `docker compose logs web`. Make sure nothing
else on the host is already using `WEB_PORT` (default 3000); change `WEB_PORT`
in `.env` and re-run `docker compose up -d` if so.

**Database connection failed / web or worker keep restarting.**
Almost always a missing or mismatched `POSTGRES_PASSWORD`. Confirm `.env` has a
real value (not empty) and that you haven't edited `POSTGRES_USER`/`POSTGRES_DB`
after the Postgres volume was already created — Postgres only applies those on
first initialization. Check `docker compose logs postgres` for the actual
error.

**The worker isn't scraping anything.**
Open Settings → Providers — each provider shows its health state, last attempt,
and the actual error if one occurred, without needing to read worker logs.
Confirm the provider is enabled (toggle on the left of its card) and that
`docker compose ps worker` shows it running/healthy. `docker compose logs worker`
shows structured, per-job log lines if you need more detail.

**Avto.net specifically is failing.**
A `403`/blocked response usually means Avto.net's anti-bot protection triggered
— this shows up in the provider's error message as "Avto.net refused this
request." It's often transient; the worker retries automatically with
exponential backoff, visible as a countdown on the provider's card. If it
persists for a long time, Avto.net's page structure or anti-bot rules may have
changed and the parser may need updating (see `packages/providers/src/providers/avto-net`).

**Email or Discord notifications aren't arriving.**
Use the "Send test notification" action next to each channel in Settings →
Notifications first — it tells you immediately whether the failure is
configuration (bad SMTP credentials, wrong Discord webhook URL) or something
else. For email, confirm `SMTP_HOST` is set in `.env` (it's blank/disabled by
default) and that `docker compose logs worker` doesn't show an SMTP auth
error. For Discord, re-copy the webhook URL from the Discord channel's
Integrations settings — a regenerated or deleted webhook is the most common
cause.

## Local development (without Docker)

Requires Node 22+, pnpm, a local PostgreSQL 16 and Redis.

```bash
pnpm install

# Point each package at your local Postgres/Redis (see the .env.example files
# in packages/database, apps/web, apps/worker).
cp packages/database/.env.example packages/database/.env
cp apps/web/.env.example apps/web/.env
cp apps/worker/.env.example apps/worker/.env

pnpm db:generate
pnpm db:migrate     # applies prisma/migrations
pnpm db:seed        # creates an admin user + realistic demo listings (local dev only)

pnpm dev:web        # http://localhost:3000
pnpm dev:worker     # scrape/match/alert queues
```

`pnpm db:seed` is a local-development convenience that also creates demo
listings and an admin account (override with `SEED_ADMIN_EMAIL` /
`SEED_ADMIN_PASSWORD`); it's not run in Docker Compose. The production/Docker
path instead runs `pnpm db:seed:essential`, which only ensures the provider
catalog, feature list, and default settings exist — real accounts are created
through the in-app setup screen, never seeded with a default password.

## Tests

```bash
pnpm test   # runs vitest across packages/shared, packages/database,
            # packages/providers, packages/notifications, and apps/worker
```

Provider parser tests are fixture-based (`packages/providers/test/fixtures`) so
they keep working even without network access, and are the first thing to
update when a marketplace changes its HTML.
