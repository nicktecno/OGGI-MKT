# Build da API Nest (Render, Fly.io, VPS ou `docker compose` local na raiz do monorepo).
FROM node:20-bookworm-slim AS base
WORKDIR /app
RUN apt-get update -y && apt-get install -y openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
# `npm ci` exige lock alinhado ao package.json; em monorepo o lock da raiz costuma ser a fonte da verdade.
RUN npm install --no-audit --no-fund

COPY prisma ./prisma/
ARG DATABASE_URL="postgresql://build:build@127.0.0.1:5432/build?schema=public"
ARG DATABASE_DIRECT_URL="postgresql://build:build@127.0.0.1:5432/build?schema=public"
ENV DATABASE_URL=$DATABASE_URL \
    DATABASE_DIRECT_URL=$DATABASE_DIRECT_URL
RUN npx prisma generate

COPY tsconfig*.json nest-cli.json ./
COPY src ./src/
COPY docker-entrypoint.sh ./
RUN chmod +x docker-entrypoint.sh && npm run build

EXPOSE 4000
ENV NODE_ENV=production
# Migrations na subida; defina DATABASE_URL, INTERNAL_API_SECRET, AUTH_SECRET (≥32), FRONTEND_URL no runtime.
CMD ["./docker-entrypoint.sh"]
