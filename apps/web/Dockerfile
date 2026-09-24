FROM node:22-slim AS base
RUN corepack enable
WORKDIR /app

FROM base AS deps
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml* ./
COPY packages/database/package.json packages/database/package.json
COPY packages/shared/package.json packages/shared/package.json
COPY packages/providers/package.json packages/providers/package.json
COPY packages/notifications/package.json packages/notifications/package.json
COPY apps/web/package.json apps/web/package.json
COPY apps/worker/package.json apps/worker/package.json
RUN pnpm install --frozen-lockfile --ignore-scripts

FROM deps AS build
COPY . .
RUN pnpm --filter @carwatch/database generate

# Next.js's build imports every route module to collect its metadata
# (`/api/health` included), which pulls in the Prisma client. That client
# constructs itself at import time and throws if DATABASE_URL is unset — it
# never actually connects during the build, so a syntactically valid
# placeholder is enough. The real DATABASE_URL is provided at container
# runtime by docker-compose and entirely replaces this.
ENV DATABASE_URL="postgresql://build:build@localhost:5432/build?schema=public"
RUN pnpm --filter @carwatch/web build

# Minimal production runtime: only the files Next.js standalone output
# traced as actually required, not the full workspace or dev deps.
FROM base AS runner
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# Set by the GHCR-publishing workflow; default to values that make an
# unreleased/local build obvious (see apps/web/src/lib/version.ts).
ARG CARWATCH_VERSION=development
ARG CARWATCH_GIT_SHA=unknown
ENV CARWATCH_VERSION=$CARWATCH_VERSION
ENV CARWATCH_GIT_SHA=$CARWATCH_GIT_SHA

RUN groupadd --system --gid 1001 carwatch && useradd --system --uid 1001 --gid carwatch webapp

COPY --from=build --chown=webapp:carwatch /app/apps/web/.next/standalone ./
COPY --from=build --chown=webapp:carwatch /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=build --chown=webapp:carwatch /app/apps/web/public ./apps/web/public

USER webapp
EXPOSE 3000

HEALTHCHECK --interval=15s --timeout=5s --start-period=20s --retries=5 \
  CMD ["node", "-e", "fetch('http://127.0.0.1:3000/api/health').then(r => process.exit(r.ok ? 0 : 1)).catch(() => process.exit(1))"]

CMD ["node", "apps/web/server.js"]
