FROM node:20-slim AS builder

RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

COPY packages/backend/package.json ./
COPY pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile --prod=false || pnpm install --prod=false

COPY tsconfig.base.json /tsconfig.base.json
COPY packages/backend/ .

RUN pnpm db:generate
RUN pnpm build

# Remove only dev deps we don't need at runtime, keep prisma for migrations
RUN rm -rf node_modules/.cache

# Production stage
FROM node:20-slim

RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY --from=builder /app/package.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma

EXPOSE 8806
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/index.js"]
