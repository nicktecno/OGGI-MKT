#!/bin/sh
set -e
url="${DATABASE_URL:-}"
direct="${DATABASE_DIRECT_URL:-}"
if [ -z "$direct" ]; then
  export DATABASE_DIRECT_URL="$url"
  direct="$url"
fi
if [ "${NODE_ENV}" = "production" ]; then
  if [ -z "$url" ]; then
    echo "DATABASE_URL não está definido. No Render: Environment → DATABASE_URL = connection string do Neon." >&2
    exit 1
  fi
  case "$url" in
    *localhost*|*127.0.0.1*)
      echo "DATABASE_URL aponta para localhost; no Render não existe Postgres local. Cola a URL do Neon (sslmode=require)." >&2
      exit 1
      ;;
  esac
  # Migrações Prisma usam advisory lock; o pooler Neon (host com -pooler-) costuma falhar ou dar timeout.
  case "$url" in
    *pooler*)
      case "$direct" in
        *pooler*)
          echo "DATABASE_URL usa o pooler do Neon (…-pooler…). Defina DATABASE_DIRECT_URL no Render com a connection string **direta** (Dashboard Neon → Connection details → sem PgBouncer). Ver docs/infrastructure.md." >&2
          exit 1
          ;;
      esac
      ;;
  esac
fi
npx prisma migrate deploy
exec node dist/src/main.js
