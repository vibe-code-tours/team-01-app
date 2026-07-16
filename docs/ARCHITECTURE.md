# Architecture — Yay Thal Pya Zat

> One page. Keep it true as the project grows.

## What it does

Yay Thal Pya Zat is a water delivery platform for Myanmar. Customers buy retail products or subscription plans (coupons for 20L bottles), schedule deliveries by province/township, and track orders in real-time. Admins manage orders with a validated status workflow, assign delivery persons, and monitor the business via dashboard.

## Diagram

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│  Next.js PWA │────→│  Hono API    │────→│  PostgreSQL  │
│  (port 3000) │     │  (port 3001) │     │  (port 5432) │
└──────┬───────┘     └──────┬───────┘     └──────────────┘
       │                    │
       │  Socket.IO         │
       └────────────────────┘
              │
              v
       ┌──────────────┐
       │  Redis Cache  │
       └──────────────┘
```

## Where things live

| Path | What |
|---|---|
| `apps/web/src/app/` | Next.js pages (user, admin, auth) |
| `apps/web/src/components/` | Shared UI (Navbar, Footer, NotificationBell) |
| `apps/web/src/lib/` | Client helpers (socket, api-client, order-status) |
| `apps/api/src/routes/` | Hono route handlers |
| `apps/api/src/lib/` | Auth, Socket.IO, notifications |
| `apps/api/src/ws/` | Socket.IO server setup |
| `packages/db/src/schema/` | Drizzle table definitions |
| `packages/db/src/migrations/` | SQL migration files |
| `docs/` | System documentation, architecture |

## External services

- **PostgreSQL 16** — Primary database (via `DATABASE_URL`)
- **Redis 7** — Cache (via `REDIS_URL`)
- **better-auth** — JWT session management
- **Socket.IO** — Real-time notifications (polling transport)

## How to run

```bash
docker compose up -d --build
```

See the [README](../README.md) for details.
