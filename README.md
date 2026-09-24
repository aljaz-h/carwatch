# CarWatch

A self-hosted used-car listing aggregator and monitoring platform. CarWatch collects
listings from multiple marketplaces (Avto.net, DoberAvto, Bolha, mobile.de, and more
over time), normalizes them into one consistent model, and lets you search, save
searches, watch individual listings, and get alerted on new matches, price drops, and
listings coming back on the market.

## Architecture

```
apps/
  web/            Next.js app (browse, listing detail, saved searches, watchlist,
                   dashboard, settings). Reads the database directly via Server
                   Components; mutations go through Server Actions.
  worker/         Long-running Node process. BullMQ queues drive scraping,
                   normalization, saved-search matching, and alert delivery.

packages/
  database/       Prisma schema + generated client + seed script. The single
                   source of truth for the data model (Vehicle vs. Listing,
                   price/status/mileage history, saved searches, alerts, ...).
  shared/         Framework-agnostic types, the deterministic match-scoring
                   engine, filter criteria types, password/session helpers.
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
pnpm db:seed        # creates an admin user + realistic demo listings

pnpm dev:web        # http://localhost:3000
pnpm dev:worker     # scrape/match/alert queues
```

The seed script prints the admin login it created (override with
`SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD`).

## Running with Docker Compose

```bash
cp .env.example .env   # edit POSTGRES_PASSWORD, SEED_ADMIN_* etc.
docker compose up --build
```

This starts Postgres, Redis, a one-off `migrate` container that applies
migrations and seeds an admin account, the web app on `$WEB_PORT` (default
3000), and the worker. Email alerts stay disabled until `SMTP_HOST` is set in
`.env`; Discord alerts just need a webhook URL added in Settings → Notifications.

## Providers

Out of the box:

- **Avto.net** — real HTTP + Cheerio scraping, rate-limited and retried with
  exponential backoff + jitter (`packages/providers/src/providers/avto-net`).
  Parser tests run against stored HTML fixtures in `packages/providers/test/fixtures`.
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

## Tests

```bash
pnpm test   # runs vitest across packages/shared, packages/providers,
            # packages/notifications, and apps/worker
```

Provider parser tests are fixture-based (`packages/providers/test/fixtures`) so
they keep working even without network access, and are the first thing to
update when a marketplace changes its HTML.
