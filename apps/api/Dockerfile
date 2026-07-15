# ── Base ─────────────────────────────────────────────────
FROM node:22-alpine AS base
WORKDIR /app

# ── Dependencies ────────────────────────────────────────
FROM base AS deps
COPY package.json package-lock.json* ./
COPY apps/api/package.json ./apps/api/
COPY packages/db/package.json ./packages/db/
COPY packages/shared/package.json ./packages/shared/
RUN npm install

# ── Production build ────────────────────────────────────
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY package.json tsconfig.json ./
COPY apps/api ./apps/api
COPY packages/shared ./packages/shared
COPY packages/db ./packages/db
RUN npm run build --workspace=@water-delivery/shared && \
    npm run build --workspace=@water-delivery/db && \
    npm run build --workspace=@water-delivery/api

# ── Production image ────────────────────────────────────
FROM base AS runner
ENV NODE_ENV=production
COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY --from=builder /app/apps/api/package.json ./apps/api/
COPY --from=builder /app/packages/db/dist ./packages/db/dist
COPY --from=builder /app/packages/db/package.json ./packages/db/
COPY --from=builder /app/packages/shared/dist ./packages/shared/dist
COPY --from=builder /app/packages/shared/package.json ./packages/shared/
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./
EXPOSE 3001
CMD ["node", "apps/api/dist/index.js"]
