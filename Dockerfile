FROM node:22-alpine AS base
WORKDIR /app

# ── Dependencies ──────────────────────────────────────
FROM base AS deps
COPY package.json package-lock.json* ./
COPY apps/api/package.json ./apps/api/
COPY apps/web/package.json ./apps/web/
COPY packages/db/package.json ./packages/db/
COPY packages/shared/package.json ./packages/shared/
RUN npm install

# ── API ───────────────────────────────────────────────
FROM base AS api-dev
COPY --from=deps /app/node_modules ./node_modules
COPY . .
EXPOSE 3001
RUN addgroup -S nonroot && adduser -S nonroot -G nonroot
USER nonroot
CMD ["npx", "tsx", "watch", "apps/api/src/index.ts"]

FROM node:22-alpine AS api-prod
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY apps/api ./apps/api
COPY packages/shared ./packages/shared
COPY packages/db ./packages/db
COPY package.json ./
EXPOSE 3001
RUN addgroup -S nonroot && adduser -S nonroot -G nonroot
USER nonroot
CMD ["node", "--import", "tsx", "apps/api/src/index.ts"]

# ── Web ───────────────────────────────────────────────
FROM base AS web-dev
COPY --from=deps /app/node_modules ./node_modules
COPY . .
WORKDIR /app/apps/web
EXPOSE 3000
RUN addgroup -S nonroot && adduser -S nonroot -G nonroot
USER nonroot
CMD ["npx", "next", "dev", "--port", "3000"]

FROM base AS web-build
COPY --from=deps /app/node_modules ./node_modules
COPY . .
WORKDIR /app
RUN npm run build --workspace=@water-delivery/shared && \
    npm run build --workspace=@water-delivery/web

FROM node:22-alpine AS web-prod
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY --from=web-build /app/apps/web/.next ./apps/web/.next
COPY --from=web-build /app/apps/web/next.config.ts ./apps/web/
COPY --from=web-build /app/apps/web/package.json ./apps/web/
COPY --from=web-build /app/packages/shared ./packages/shared
COPY --from=web-build /app/package.json ./
WORKDIR /app/apps/web
EXPOSE 3000
RUN addgroup -S nonroot && adduser -S nonroot -G nonroot
USER nonroot
CMD ["node", "node_modules/.bin/next", "start", "-p", "3000"]
