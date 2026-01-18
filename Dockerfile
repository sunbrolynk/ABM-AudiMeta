# ===========================================
# AudiMeta Dockerfile (Updated)
# ===========================================
# This version runs database migrations on startup
# ===========================================

FROM node:20.12.2-alpine3.18 AS base

# Install dumb-init for proper signal handling
RUN apk --no-cache add dumb-init

# ===========================================
# All deps stage
# ===========================================
FROM base AS deps
WORKDIR /app
ADD package.json package-lock.json ./
RUN npm ci

# ===========================================
# Production only deps stage
# ===========================================
FROM base AS production-deps
WORKDIR /app
ADD package.json package-lock.json ./
RUN npm ci --omit=dev

# ===========================================
# Build stage
# ===========================================
FROM base AS build
WORKDIR /app
COPY --from=deps /app/node_modules /app/node_modules
ADD . .
RUN node ace build --ignore-ts-errors

# ===========================================
# Production stage
# ===========================================
FROM base

ENV NODE_ENV=production
WORKDIR /app

COPY --from=production-deps /app/node_modules /app/node_modules
COPY --from=build /app/build /app

RUN npx patch-package

# Expose the port (matches PORT in .env)
EXPOSE 3333

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD wget -q --spider http://localhost:${PORT:-3333}/ || exit 1

# Start with migrations then server
# Using dumb-init for proper signal handling
CMD ["dumb-init", "sh", "-c", "node ace migration:run --force && node ./bin/server.js"]
