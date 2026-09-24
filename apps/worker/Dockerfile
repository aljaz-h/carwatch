FROM node:22-slim AS base
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

FROM deps AS runner
ENV NODE_ENV=production
ENV HEARTBEAT_FILE=/tmp/carwatch-worker-heartbeat
RUN groupadd --system --gid 1001 carwatch && useradd --system --uid 1001 --gid carwatch worker

COPY --chown=worker:carwatch pnpm-workspace.yaml package.json ./
COPY --chown=worker:carwatch packages/database packages/database
COPY --chown=worker:carwatch packages/shared packages/shared
COPY --chown=worker:carwatch packages/providers packages/providers
COPY --chown=worker:carwatch packages/notifications packages/notifications
COPY --chown=worker:carwatch apps/worker apps/worker
RUN pnpm --filter @carwatch/database generate

USER worker
WORKDIR /app/apps/worker

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD ["node", "-e", "const fs=require('fs');const p=process.env.HEARTBEAT_FILE;try{const age=Date.now()-fs.statSync(p).mtimeMs;process.exit(age<90000?0:1)}catch{process.exit(1)}"]

CMD ["pnpm", "exec", "tsx", "src/index.ts"]
