# ── Production ──────────────────────────────────────────
FROM node:22-alpine
ENV NODE_ENV=production
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

EXPOSE 3001
CMD ["node", "--import", "tsx", "apps/api/src/index.ts"]
