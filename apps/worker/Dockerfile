FROM node:22-slim AS base
# CMD below runs `pnpm exec tsx` as the non-root `worker` user, which would
# otherwise make corepack try to fetch/cache the pinned pnpm version into
# that user's (nonexistent/unwritable) home directory on every container
# start. Pointing corepack at a shared, writable cache under /app instead
# means the pnpm binary root already downloaded during `deps` below is
# reused at runtime — no permission error, no network fetch on startup.
ENV COREPACK_HOME=/app/.corepack
# Same reasoning as COREPACK_HOME above: the Avto.net provider drives a real
# headless Chromium (see packages/providers/src/http/browser-fetch.ts)
# instead of plain HTTP, since Avto.net blocks plain requests outright.
# Installed once as root below, into a shared path the non-root `worker`
# user can still read at runtime.
ENV PLAYWRIGHT_BROWSERS_PATH=/app/.playwright
RUN corepack enable
WORKDIR /app

FROM base AS deps
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml* ./
COPY packages/database/package.json packages/database/package.json
COPY packages/shared/package.json packages/shared/package.json
COPY packages/providers/package.json packages/providers/package.json
COPY packages/notifications/package.json packages/notifications/package.json
COPY apps/worker/package.json apps/worker/package.json
RUN pnpm install --frozen-lockfile --ignore-scripts
# --with-deps also apt-installs the OS-level libraries Chromium needs
# (fonts, libnss3, libatk, ...) — network + root required, hence here.
RUN pnpm --filter @carwatch/providers exec playwright install --with-deps chromium

FROM deps AS runner
ENV NODE_ENV=production
ENV HEARTBEAT_FILE=/tmp/carwatch-worker-heartbeat

# Set by the GHCR-publishing workflow; default to values that make an
# unreleased/local build obvious (see apps/worker/src/env.ts).
ARG CARWATCH_VERSION=development
ARG CARWATCH_GIT_SHA=unknown
ENV CARWATCH_VERSION=$CARWATCH_VERSION
ENV CARWATCH_GIT_SHA=$CARWATCH_GIT_SHA

RUN groupadd --system --gid 1001 carwatch && useradd --system --uid 1001 --gid carwatch worker

COPY tsconfig.base.json ./
COPY packages/database packages/database
COPY packages/shared packages/shared
COPY packages/providers packages/providers
COPY packages/notifications packages/notifications
COPY apps/worker apps/worker
RUN pnpm --filter @carwatch/database generate

# Hand the whole app directory over to the user CMD actually runs as: the
# source just copied in, but also node_modules, the pnpm/corepack cache, and
# the Chromium install, all populated as root above — `pnpm exec` and the
# Avto.net provider's browser both touch these at runtime, not just source.
RUN chown -R worker:carwatch /app

USER worker
WORKDIR /app/apps/worker

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD ["node", "-e", "const fs=require('fs');const p=process.env.HEARTBEAT_FILE;try{const age=Date.now()-fs.statSync(p).mtimeMs;process.exit(age<90000?0:1)}catch{process.exit(1)}"]

CMD ["pnpm", "exec", "tsx", "src/index.ts"]
