# Water Delivery — Project Conventions

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
| Brand     | YTPZ Brand Guide v1.0                     |

## Project Structure

```
water-delivery/
├── apps/
│   ├── api/           # Hono API server (port 3001)
│   │   ├── src/
│   │   │   ├── index.ts          # Entry: Hono + Socket.IO + HTTP
│   │   │   ├── lib/              # Auth, Socket.IO, notifications
│   │   │   ├── routes/           # Hono routers
│   │   │   ├── middleware/       # Auth, error handling
│   │   │   └── ws/index.ts      # Socket.IO setup
│   │   └── package.json
│   └── web/           # Next.js PWA (port 3000)
│       ├── src/
│       │   ├── app/              # App Router (user, admin, auth, delivery)
│       │   ├── components/       # Navbar, Footer, NotificationBell, Toast
│       │   └── lib/              # socket, api-client, order-status, contexts
│       └── package.json
├── packages/
│   ├── db/            # Drizzle ORM + schema + migrations
│   └── shared/        # Shared types & constants
├── docker-compose.yml
├── CLAUDE.md
├── AGENTS.md
└── package.json
```

## Agent Instructions

- **Think once, execute decisively.**
- **Minimize token usage.**
- **Batch related file operations.**
- **Never re-read files you just wrote.**
- **Use simple short to the point english.**

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

- **Name**: `ytpz` (light) / `dark` (dark mode)
- **Primary**: Deep Well Navy `#0B2545`
- **Secondary**: Fresh Aqua `#2CA6A4`
- **Accent**: Delivery Amber `#F2A65A`
- **Fonts**: Poppins (headings), Inter (body)

## MCP Servers

| MCP        | Purpose                          |
| ---------- | -------------------------------- |
| postgres   | Query and inspect database       |
| github     | PRs, issues, repo management     |
| playwright | Browser testing for landing page |
