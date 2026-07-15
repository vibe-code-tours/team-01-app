FROM node:22-alpine

RUN apk add --no-cache bash

ENV NODE_ENV=production
WORKDIR /app

# Copy the entire monorepo
COPY . .

# Install all workspace dependencies
RUN npm ci

EXPOSE 3001

CMD ["node", "--import", "tsx", "apps/api/src/index.ts"]