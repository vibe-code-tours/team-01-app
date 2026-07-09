FROM node:22-alpine AS base
WORKDIR /app

FROM base AS deps
COPY package.json package-lock.json* ./
COPY apps/api/package.json ./apps/api/
COPY packages/db/package.json ./packages/db/
COPY packages/shared/package.json ./packages/shared/
RUN npm install

FROM base AS dev
COPY --from=deps /app/node_modules ./node_modules
COPY . .
EXPOSE 3001
CMD ["npx", "tsx", "watch", "apps/api/src/index.ts"]

# --- Production ---
FROM base AS build
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx tsc -p apps/api/tsconfig.json --noEmit

FROM node:22-alpine AS prod
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY --from=build /app/apps/api ./apps/api
COPY --from=build /app/packages/shared ./packages/shared
COPY --from=build /app/packages/db ./packages/db
COPY --from=build /app/package.json ./
EXPOSE 3001
CMD ["node", "--import", "tsx", "apps/api/src/index.ts"]
