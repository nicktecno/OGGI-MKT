# API Nest — contexto = raiz do monorepo (Render com repo root por defeito).
# Alternativa: no Render, Root Directory = apps/api e Dockerfile = apps/api/Dockerfile.
FROM node:20-bookworm-slim AS base
WORKDIR /app
RUN apt-get update -y && apt-get install -y openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*

COPY apps/api/package*.json ./
RUN npm install --no-audit --no-fund

COPY apps/api/prisma ./prisma/
RUN npx prisma generate

COPY apps/api/tsconfig*.json apps/api/nest-cli.json ./
COPY apps/api/src ./src/
RUN npm run build

EXPOSE 4000
ENV NODE_ENV=production
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/src/main.js"]
