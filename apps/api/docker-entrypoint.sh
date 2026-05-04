#!/bin/sh
set -e
url="${DATABASE_URL:-}"
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
fi
npx prisma migrate deploy
exec node dist/src/main.js
