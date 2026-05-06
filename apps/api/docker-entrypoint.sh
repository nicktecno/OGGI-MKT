#!/bin/sh
set -e
url="${DATABASE_URL:-}"
direct="${DATABASE_DIRECT_URL:-}"
if [ -z "$direct" ]; then
  export DATABASE_DIRECT_URL="$url"
  direct="$url"
fi

# Neon: host pooled inclui "-pooler"; a ligação direta remove esse segmento (mesmo user/db/query).
# Se só tiveres a URL pooled no Render, derivamos DATABASE_DIRECT_URL para o Prisma migrate deploy.
neon_derive_direct_from_pooled() {
  printf '%s' "$1" | sed 's/-pooler//g'
}

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
  # Migrações Prisma usam advisory lock; o pooler Neon costuma falhar — directUrl não pode ser pooled.
  case "$url" in
    *pooler*)
      case "$direct" in
        *pooler*)
          derived="$(neon_derive_direct_from_pooled "$url")"
          if [ "$derived" != "$url" ]; then
            case "$derived" in
              *pooler*) ;;
              *)
                export DATABASE_DIRECT_URL="$derived"
                direct="$derived"
                echo "DATABASE_DIRECT_URL derivada da DATABASE_URL (Neon: removido \"-pooler\" do host) para prisma migrate deploy." >&2
                ;;
            esac
          fi
          ;;
      esac
      case "$direct" in
        *pooler*)
          echo "DATABASE_URL (e/ou DATABASE_DIRECT_URL) ainda usam o pooler do Neon. Defina DATABASE_DIRECT_URL com a connection string **direta** (Dashboard Neon → sem PgBouncer), ou use o host pooled típico com \"-pooler\" no nome para derivarmos automaticamente. Ver docs/infrastructure.md." >&2
          exit 1
          ;;
      esac
      ;;
  esac
fi
npx prisma migrate deploy
exec node dist/src/main.js
