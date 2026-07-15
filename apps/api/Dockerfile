FROM node:22-alpine AS base
WORKDIR /app

# ── Dependencies ──────────────────────────────────────
FROM base AS deps
COPY package.json package-lock.json* ./
COPY apps/api/package.json ./apps/api/
COPY ../../packages/db/package.json ./packages/db/
COPY ../../packages/shared/package.json ./packages/shared/
RUN npm install

# ── Development ───────────────────────────────────────
FROM base AS api-dev
COPY --from=deps /app/node_modules ./node_modules
COPY . .
EXPOSE 3001
CMD ["npx", "tsx", "apps/api/src/index.ts"]

# ── Production ────────────────────────────────────────
FROM base AS api-prod
COPY --from=deps /app/node_modules ./node_modules
COPY package.json tsconfig.json ./
COPY apps/api ./apps/api
COPY ../../packages/shared ./packages/shared
COPY ../../packages/db ./packages/db
RUN npm run build --workspace=@water-delivery/shared && \
    npm run build --workspace=@water-delivery/db && \
    npm run build --workspace=@water-delivery/api
EXPOSE 3001
CMD ["node", "--import", "tsx", "apps/api/src/index.ts"]
