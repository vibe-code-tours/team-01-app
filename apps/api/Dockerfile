# ── Base ─────────────────────────────────────────────────
FROM node:22-alpine AS base
WORKDIR /app

# ── Install dependencies ────────────────────────────────
COPY package.json package-lock.json ./
COPY apps/api/package.json ./apps/api/
COPY packages/db/package.json ./packages/db/
COPY packages/shared/package.json ./packages/shared/
RUN npm ci

# ── Build ───────────────────────────────────────────────
COPY package.json tsconfig.json ./
COPY apps/api ./apps/api
COPY packages/shared ./packages/shared
COPY packages/db ./packages/db
RUN npm run build --workspace=@water-delivery/shared && \
    npm run build --workspace=@water-delivery/db && \
    npm run build --workspace=@water-delivery/api

# ── Production image ────────────────────────────────────
FROM node:22-alpine AS runner
ENV NODE_ENV=production
WORKDIR /app

COPY package.json ./
COPY --from=base /app/apps/api/dist ./apps/api/dist
COPY --from=base /app/apps/api/package.json ./apps/api/
COPY --from=base /app/packages/db/dist ./packages/db/dist
COPY --from=base /app/packages/db/package.json ./packages/db/
COPY --from=base /app/packages/shared/dist ./packages/shared/dist
COPY --from=base /app/packages/shared/package.json ./packages/shared/
COPY --from=base /app/node_modules ./node_modules

EXPOSE 3001
CMD ["node", "apps/api/dist/index.js"]
