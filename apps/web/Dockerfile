# Stage 1: Build
FROM node:20-alpine AS builder
RUN corepack enable && corepack prepare pnpm@9 --activate

WORKDIR /app
COPY package.json pnpm-workspace.yaml turbo.json tsconfig.base.json ./
COPY apps/web/ apps/web/
COPY packages/ packages/

RUN pnpm install --frozen-lockfile
RUN pnpm --filter @ai-dungeon/shared build
RUN pnpm --filter @ai-dungeon/web build

# Stage 2: Nginx serve
FROM nginx:alpine AS runner
COPY --from=builder /app/apps/web/dist /usr/share/nginx/html
COPY apps/web/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 3000
CMD ["nginx", "-g", "daemon off;"]
