# API Nest — contexto = raiz do monorepo (Render com repo root por defeito).
# Alternativa: no Render, Root Directory = apps/api e Dockerfile = apps/api/Dockerfile.
FROM node:20-bookworm-slim AS base
WORKDIR /app
RUN apt-get update -y && apt-get install -y openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*

COPY apps/api/package*.json ./
RUN npm install --no-audit --no-fund

COPY apps/api/prisma ./prisma/
# Só nesta linha: não persistir ENV na imagem — senão o runtime pode usar 127.0.0.1 e o migrate falha (P1001).
# `npm run build` corre `prebuild` → `prisma generate`; precisa das mesmas vars nessa RUN.
RUN DATABASE_URL="postgresql://build:build@127.0.0.1:5432/build?schema=public" \
    DATABASE_DIRECT_URL="postgresql://build:build@127.0.0.1:5432/build?schema=public" \
    npx prisma generate

COPY apps/api/tsconfig*.json apps/api/nest-cli.json ./
COPY apps/api/src ./src/
COPY apps/api/docker-entrypoint.sh ./docker-entrypoint.sh
RUN chmod +x docker-entrypoint.sh \
  && DATABASE_URL="postgresql://build:build@127.0.0.1:5432/build?schema=public" \
     DATABASE_DIRECT_URL="postgresql://build:build@127.0.0.1:5432/build?schema=public" \
     npm run build

EXPOSE 4000
ENV NODE_ENV=production
CMD ["./docker-entrypoint.sh"]
