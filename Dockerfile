# ── Build ────────────────────────────────────────────────
FROM node:22-alpine AS builder
WORKDIR /app

# Copy workspace root files
COPY package.json package-lock.json ./
COPY apps/api/package.json ./apps/api/
COPY packages/db/package.json ./packages/db/
COPY packages/shared/package.json ./packages/shared/
RUN npm ci

# Copy source
COPY apps/api ./apps/api
COPY packages/shared ./packages/shared
COPY packages/db ./packages/db

RUN npm run build --workspace=@water-delivery/shared && \
    npm run build --workspace=@water-delivery/db && \
    npm run build --workspace=@water-delivery/api

# ── Production ──────────────────────────────────────────
FROM node:22-alpine
ENV NODE_ENV=production
WORKDIR /app

COPY package.json ./
COPY apps/api/package.json ./apps/api/
COPY packages/db/package.json ./packages/db/
COPY packages/shared/package.json ./packages/shared/
COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY --from=builder /app/packages/db/dist ./packages/db/dist
COPY --from=builder /app/packages/shared/dist ./packages/shared/dist
COPY --from=builder /app/node_modules ./node_modules

EXPOSE 3001
CMD ["node", "apps/api/dist/index.js"]
