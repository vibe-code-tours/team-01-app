#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"

set -a
# shellcheck source=/dev/null
[ -f "$ROOT_DIR/.env" ] && . "$ROOT_DIR/.env"
set +a

USER_NAME="${DATABASE_USER:-postgres}"
PASSWORD="${DATABASE_PASSWORD:-postgres}"
DB_NAME="${DATABASE_NAME:-water_delivery}"

build_url() {
  local host="$1"
  local port="$2"
  echo "postgresql://${USER_NAME}:${PASSWORD}@${host}:${port}/${DB_NAME}"
}

pg_ready() {
  local host="$1"
  local port="$2"
  pg_isready -h "$host" -p "$port" -q 2>/dev/null
}

if [ "${DATABASE_FORCE_URL:-}" = "1" ] && [ -n "${DATABASE_URL:-}" ]; then
  if ! pg_ready "${DATABASE_HOST:-postgres}" "${DATABASE_PORT:-5432}" 2>/dev/null; then
    host_part="${DATABASE_URL#*@}"
    host_part="${host_part%%/*}"
    db_host="${host_part%:*}"
    db_port="${host_part##*:}"
    if ! pg_ready "$db_host" "$db_port"; then
      echo "DATABASE_FORCE_URL is set but PostgreSQL is unreachable at ${db_host}:${db_port}" >&2
      exit 1
    fi
  fi
  exit 0
fi

if pg_ready postgres 5432; then
  export DATABASE_URL="$(build_url postgres 5432)"
elif pg_ready water-delivery-db 5432; then
  export DATABASE_URL="$(build_url water-delivery-db 5432)"
elif command -v docker >/dev/null 2>&1; then
  DB_IP="$(
    docker inspect -f '{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}' water-delivery-db 2>/dev/null \
      || sudo docker inspect -f '{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}' water-delivery-db 2>/dev/null \
      || true
  )"
  if [ -n "$DB_IP" ] && pg_ready "$DB_IP" 5432; then
    export DATABASE_URL="$(build_url "$DB_IP" 5432)"
  fi
fi

if [ -z "${DATABASE_URL:-}" ]; then
  if pg_ready host.docker.internal 5433; then
    export DATABASE_URL="$(build_url host.docker.internal 5433)"
  elif pg_ready localhost 5433; then
    export DATABASE_URL="$(build_url localhost 5433)"
  fi
fi

if [ -z "${DATABASE_URL:-}" ]; then
  echo "Cannot reach PostgreSQL." >&2
  echo "Start the database with: docker compose up -d postgres" >&2
  echo "Then reopen the devcontainer so it joins the water-delivery network." >&2
  exit 1
fi
