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
COPY . .
RUN pnpm --filter @carwatch/database generate

WORKDIR /app/apps/worker
CMD ["pnpm", "exec", "tsx", "src/index.ts"]
