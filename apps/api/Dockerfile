# ─── Strick'in API — Production Dockerfile ──────────────────────────────────
# Multi-stage build for NestJS + Prisma in an npm workspaces monorepo.
# Compatible with Railway, Fly.io, Render, Cloud Run.

# ═════════════════════════════════════════════════════════════════════════════
# Stage 1 — Builder
# ═════════════════════════════════════════════════════════════════════════════
FROM node:20-alpine AS builder

# OpenSSL required by Prisma on Alpine
RUN apk add --no-cache openssl libc6-compat

WORKDIR /app

# Copy monorepo root manifests + workspace manifests
COPY package.json package-lock.json* ./
COPY apps/api/package.json ./apps/api/
COPY packages/shared/package.json ./packages/shared/
COPY packages/design-system/package.json ./packages/design-system/

# Install ALL workspaces deps (needed for build)
# --include=dev because we need typescript/nest-cli/prisma to build
RUN npm ci --include=dev --ignore-scripts

# Copy source
COPY tsconfig.base.json ./
COPY apps/api ./apps/api
COPY packages/shared ./packages/shared
COPY packages/design-system ./packages/design-system

# Generate Prisma client
RUN npx prisma generate --schema=apps/api/prisma/schema.prisma

# Build shared package (if it has a build step)
RUN if [ -f packages/shared/tsconfig.build.json ]; then \
      npm run build --workspace=@strickin/shared --if-present; \
    fi

# Build the NestJS app
RUN npm run build --workspace=@strickin/api

# ═════════════════════════════════════════════════════════════════════════════
# Stage 2 — Runner (slim production image)
# ═════════════════════════════════════════════════════════════════════════════
FROM node:20-alpine AS runner

RUN apk add --no-cache openssl libc6-compat dumb-init

WORKDIR /app

ENV NODE_ENV=production

# Copy full monorepo structure (node_modules includes workspaces symlinks)
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./
COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY --from=builder /app/apps/api/package.json ./apps/api/
COPY --from=builder /app/apps/api/prisma ./apps/api/prisma
COPY --from=builder /app/packages ./packages

# Non-root user for security
RUN addgroup -S strickin && adduser -S strickin -G strickin \
 && chown -R strickin:strickin /app
USER strickin

# Railway injects its own $PORT, but default to 4000 locally
EXPOSE 4000

# dumb-init handles signals (SIGTERM from Railway) and zombie processes
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "apps/api/dist/main.js"]
