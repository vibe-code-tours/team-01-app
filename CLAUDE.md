# Water Delivery — Project Conventions

## Agent Instructions

- **Think once, execute decisively.** Do not reconsider, second-guess, or re-evaluate decisions already made. Plan carefully upfront, then commit to the plan without circling back.
- **Minimize token usage.** No "Actually...", "Wait—", or self-correction loops. If you wrote it, it's intentional unless proven broken by tests or errors.
- **Batch related file operations.** Write all files in one pass rather than creating, reading back, then editing.
- **Never re-read files you just wrote.** Trust your output. Only re-read when debugging real failures.
- **Skip explanation of your own prior choices.** Only explain when the user asks. No self-commentary like "I noticed that..." or "The issue is that..." unless responding to a specific error.
- **Use simple short to the point english** explain with short and simple english.

## Tech Stack

| Layer     | Technology                                |
| --------- | ----------------------------------------- |
| Frontend  | Next.js 15 + DaisyUI v5 + Tailwind CSS v4 |
| Backend   | Hono v4 + @hono/node-server               |
| ORM       | Drizzle ORM                               |
| Database  | PostgreSQL 16                             |
| Cache     | Redis 7                                   |
| Real-time | Socket.IO v4                              |
| Auth      | better-auth (JWT)                         |
| Runtime   | Node.js 22                                |
| Monorepo  | npm workspaces                            |
| Brand     | YTPZ Brand Guide v1.0                     |

## Project Structure

```
water-delivery/
├── apps/
│   ├── api/           # Hono API server (port 3001)
│   │   ├── src/
│   │   │   ├── index.ts          # Entry: Hono app + Socket.IO + HTTP server
│   │   │   ├── config/env.ts     # Environment variables
│   │   │   ├── lib/
│   │   │   │   ├── auth.ts       # better-auth config
│   │   │   │   ├── io.ts         # Socket.IO instance getter
│   │   │   │   └── notifications.ts  # Notification + socket emission
│   │   │   ├── routes/           # Hono routers
│   │   │   ├── middleware/       # Auth, error handling
│   │   │   └── ws/index.ts      # Socket.IO setup
│   │   ├── Dockerfile
│   │   └── package.json
│   └── web/           # Next.js app (port 3000)
│       ├── src/
│       │   ├── app/              # App Router pages
│       │   │   ├── page.tsx              # Home
│       │   │   ├── layout.tsx            # Root layout (theme: ytpz)
│       │   │   ├── products/page.tsx     # Product listing
│       │   │   ├── subscription/page.tsx # Subscription plans
│       │   │   ├── dashboard/page.tsx    # User dashboard
│       │   │   ├── orders/[id]/page.tsx  # Order detail
│       │   │   ├── cart/page.tsx         # Shopping cart
│       │   │   ├── (auth)/login/page.tsx
│       │   │   ├── (auth)/signup/page.tsx
│       │   │   ├── admin/               # Admin panel
│       │   │   │   ├── layout.tsx
│       │   │   │   ├── page.tsx         # Dashboard
│       │   │   │   ├── orders/          # Order management
│       │   │   │   ├── assignments/     # Delivery assignment
│       │   │   │   ├── products/        # Product CRUD
│       │   │   │   ├── schedules/       # Schedule management
│       │   │   │   └── users/           # User management
│       │   │   ├── delivery/page.tsx    # Delivery person dashboard
│       │   │   └── api/                # Next.js API routes (proxy)
│       │   ├── components/
│       │   │   ├── Navbar.tsx
│       │   │   ├── Footer.tsx
│       │   │   ├── NotificationBell.tsx
│       │   │   ├── Toast.tsx
│       │   │   ├── Providers.tsx
│       │   │   └── admin/
│       │   │       ├── Sidebar.tsx
│       │   │       ├── StatusBadge.tsx
│       │   │       └── Pagination.tsx
│       │   └── lib/
│       │       ├── api-client.ts        # fetch helpers
│       │       ├── socket.ts            # Socket.IO client
│       │       ├── order-status.ts      # Status transition rules
│       │       ├── notification-context.tsx
│       │       ├── cart-context.tsx
│       │       └── auth.ts
│       ├── Dockerfile
│       └── package.json
├── packages/
│   ├── db/            # Drizzle ORM
│   │   ├── src/
│   │   │   ├── db.ts
│   │   │   ├── index.ts
│   │   │   ├── schema/           # Table definitions
│   │   │   │   ├── users.ts
│   │   │   │   ├── orders.ts
│   │   │   │   ├── products.ts
│   │   │   │   ├── delivery.ts
│   │   │   │   ├── notifications.ts
│   │   │   │   └── ...
│   │   │   ├── migrations/
│   │   │   └── seed.ts
│   │   └── package.json
│   └── shared/        # Shared types & constants
│       └── package.json
├── docker-compose.yml
├── CLAUDE.md
└── package.json
```

## Coding Standards

- **TypeScript strict mode** — no `any`, explicit return types for exported functions
- **ESM** — all packages use `"type": "module"`, use `.js` extensions in imports
- **Prefer `const`** over `let`, never use `var`
- **Named exports** preferred over default exports (except Next.js pages)
- **API responses** always follow: `{ success: boolean, data?: T, error?: string }`

## Import Aliases

- `@water-delivery/db` → `packages/db/src`
- `@water-delivery/shared` → `packages/shared/src`
- `@/` → `apps/web/src/` (Next.js path alias)

## Git Conventions

- Branch names: `feat/<description>`, `fix/<description>`, `chore/<description>`
- Commit messages: conventional commits (`feat:`, `fix:`, `chore:`, `docs:`)

## Docker Services

| Service  | Port | Notes                             |
| -------- | ---- | --------------------------------- |
| postgres | 5432 | Health checked, persistent volume |
| redis    | 6379 | Health checked, persistent volume |
| api      | 3001 | Hot-reload via volume mount       |
| web      | 3000 | Hot-reload via volume mount       |

## Theme

- **Theme name**: `ytpz` (default light), `dark` (prefersdark)
- **Primary**: Deep Well Navy `#0B2545`
- **Secondary**: Fresh Aqua `#2CA6A4`
- **Accent**: Delivery Amber `#F2A65A`
- **Fonts**: Poppins (headings), Inter (body)
- Set on `<html data-theme="ytpz">`

## MCP Servers

| MCP        | Purpose                          |
| ---------- | -------------------------------- |
| postgres   | Query and inspect database       |
| github     | PRs, issues, repo management     |
| playwright | Browser testing for landing page |

## Domain Specialists

### Backend (apps/api)

- Hono routers: `const routes = new Hono();`
- Mount in `src/index.ts`: `app.route("/api/<resource>", <resource>Routes)`
- Auth middleware on protected routes: `routes.use(authMiddleware)`
- Socket.IO: join rooms `user:{userId}` and `admins`
- Order status transitions validated in PATCH handler

### Frontend (apps/web)

- `"use client"` only when needed (event handlers, useState, useEffect)
- Prefer server components for data-fetching pages
- DaisyUI v5: `@import "tailwindcss"; @plugin "daisyui";`
- Theme: `data-theme="ytpz"`
- Socket.IO: use `connectSocket()`, `getSocket()`, `onSocketReady()`

### Database (packages/db)

- `pgTable()` for all tables
- `uuid("id").defaultRandom().primaryKey()` for PKs
- `timestamp("created_at", { withTimezone: true }).defaultNow()` for timestamps
- `pgEnum()` for enums (role, status, etc.)
- Migrations: `npx drizzle-kit generate` then `npx drizzle-kit migrate`
