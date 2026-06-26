# Stage 1: Build
FROM node:20-alpine AS builder
RUN corepack enable && corepack prepare pnpm@9 --activate

WORKDIR /app
COPY package.json pnpm-workspace.yaml turbo.json tsconfig.base.json ./
COPY apps/server/ apps/server/
COPY packages/ packages/

RUN pnpm install --frozen-lockfile
RUN pnpm --filter @ai-dungeon/agent-core build
RUN pnpm --filter @ai-dungeon/server build
RUN cd apps/server && npx prisma generate

# Stage 2: Run
FROM node:20-alpine AS runner
RUN corepack enable && corepack prepare pnpm@9 --activate

WORKDIR /app
COPY --from=builder /app/apps/server/dist ./apps/server/dist
COPY --from=builder /app/apps/server/prisma ./apps/server/prisma
COPY --from=builder /app/apps/server/package.json ./apps/server/package.json
COPY --from=builder /app/packages ./packages
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/pnpm-workspace.yaml ./pnpm-workspace.yaml

EXPOSE 4000
CMD ["node", "apps/server/dist/index.js"]
