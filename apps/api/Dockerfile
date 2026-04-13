# ─── Strick'in API — Production Dockerfile ──────────────────────────────────
FROM node:20-alpine AS base
WORKDIR /app

# Install dependencies
FROM base AS deps
COPY package.json package-lock.json ./
COPY apps/api/package.json apps/api/
COPY packages/shared/package.json packages/shared/
RUN npm ci --omit=dev

# Build
FROM base AS builder
COPY package.json package-lock.json ./
COPY apps/api/ apps/api/
COPY packages/shared/ packages/shared/
RUN npm ci
RUN npm run build --workspace=packages/shared
RUN cd apps/api && npx prisma generate && npx nest build

# Production image
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nestjs

COPY --from=deps /app/node_modules ./node_modules
COPY --from=builder /app/apps/api/dist ./dist
COPY --from=builder /app/apps/api/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma

USER nestjs

EXPOSE 4000
ENV PORT=4000

CMD ["node", "dist/main.js"]
