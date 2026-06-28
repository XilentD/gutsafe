# ---- Build Stage ----
FROM node:20-alpine AS builder
WORKDIR /app

RUN corepack enable && corepack prepare pnpm@9 --activate

COPY pnpm-lock.yaml package.json ./
RUN pnpm install --frozen-lockfile --prod=false

COPY prisma ./prisma/
RUN npx prisma generate

COPY . .
RUN pnpm build

# ---- Runtime Stage ----
FROM node:20-alpine AS runner
WORKDIR /app

RUN corepack enable && corepack prepare pnpm@9 --activate

# Install PostgreSQL client + PostGIS (for database)
RUN apk add --no-cache postgresql16-client postgis

COPY --from=builder /app/package.json /app/pnpm-lock.yaml ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/public ./public
COPY --from=builder /app/next.config.ts ./
COPY --from=builder /app/tsconfig.json ./

EXPOSE 3000

CMD ["sh", "-c", "npx prisma db push --skip-generate && npx next start -p 3000"]
