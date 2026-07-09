FROM node:22-alpine AS base
WORKDIR /app

FROM base AS deps
COPY package.json package-lock.json* ./
COPY apps/web/package.json ./apps/web/
COPY packages/shared/package.json ./packages/shared/
RUN npm install

FROM base AS dev
COPY --from=deps /app/node_modules ./node_modules
COPY . .
WORKDIR /app/apps/web
EXPOSE 3000
CMD ["npx", "next", "dev", "--port", "3000"]

# --- Production ---
FROM base AS build
COPY --from=deps /app/node_modules ./node_modules
COPY . .
WORKDIR /app
RUN npm run build --workspace=@water-delivery/shared && \
    npm run build --workspace=@water-delivery/web

FROM node:22-alpine AS prod
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY --from=build /app/apps/web/.next ./apps/web/.next
COPY --from=build /app/apps/web/next.config.ts ./apps/web/
COPY --from=build /app/apps/web/package.json ./apps/web/
COPY --from=build /app/packages/shared ./packages/shared
COPY --from=build /app/package.json ./
WORKDIR /app/apps/web
EXPOSE 3000
CMD ["node", "node_modules/.bin/next", "start", "-p", "3000"]
