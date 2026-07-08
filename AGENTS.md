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
| Auth      | JWT + bcryptjs                            |
| Runtime   | Node.js 22                                |
| Monorepo  | npm workspaces                            |

## Project Structure

```
water-delivery/
├── apps/
│   ├── api/           # Hono API server (port 3001)
│   │   ├── src/
│   │   │   ├── index.ts          # Entry: Hono app + Socket.IO + HTTP server
│   │   │   ├── config/env.ts     # Environment variables
│   │   │   ├── routes/           # Hono routers (auth.ts, health.ts)
│   │   │   ├── middleware/       # Auth, error handling middleware
│   │   │   └── ws/              # Socket.IO handlers
│   │   ├── Dockerfile            # Multi-stage (dev: tsx watch, prod: node)
│   │   ├── tsconfig.json
│   │   └── package.json          # @water-delivery/api
│   └── web/           # Next.js landing page (port 3000)
│       ├── src/
│       │   ├── app/              # App Router pages
│       │   │   ├── page.tsx
│       │   │   ├── layout.tsx
│       │   │   ├── products/page.tsx
│       │   │   ├── subscription/page.tsx
│       │   │   ├── pricing/page.tsx
│       │   │   ├── about/page.tsx
│       │   │   └── contact/page.tsx
│       │   └── components/       # Shared UI components (Navbar, Footer)
│       ├── Dockerfile            # Multi-stage (dev: next dev, prod: standalone)
│       ├── next.config.ts
│       ├── postcss.config.mjs    # Tailwind CSS v4 + DaisyUI v5
│       ├── tsconfig.json
│       └── package.json          # @water-delivery/web
├── packages/
│   ├── db/            # Drizzle ORM
│   │   ├── src/
│   │   │   ├── db.ts             # Connection singleton
│   │   │   ├── index.ts          # Barrel export
│   │   │   └── schema/           # Table definitions (users.ts)
│   │   ├── drizzle.config.ts
│   │   ├── tsconfig.json
│   │   └── package.json          # @water-delivery/db
│   └── shared/        # Shared types & constants
│       ├── src/
│       │   ├── index.ts           # Barrel export
│       │   ├── types/            # API response, auth types
│       │   └── constants/       # Roles, statuses
│       ├── tsconfig.json
│       └── package.json          # @water-delivery/shared
├── .devcontainer/
│   ├── devcontainer.json         # VS Code devcontainer config
│   ├── Dockerfile                # Dev container (Node.js 22 + tools)
│   └── claude-env.sh             # Vibe proxy + Claude Code setup
├── .claude/
│   ├── commands/                # Slash commands
│   │   ├── dev.md               # /dev — Start all services
│   │   ├── migrate.md           # /migrate — Run Drizzle migrations
│   │   └── db-push.md           # /db-push — Push schema changes
│   └── docs/                    # Reference docs
│       ├── backend.md           # Hono + Socket.IO specialist
│       ├── frontend.md          # Next.js + DaisyUI specialist
│       ├── database.md          # PostgreSQL + Drizzle specialist
│       ├── water-delivery-stack.md
│       └── docker-compose.md
├── .env                          # Environment variables (gitignored)
├── .env.example                  # Environment template
├── .gitignore
├── docker-compose.yml            # Full stack: all 5 services + hot-reload
├── .claude/                      # Claude Code config, commands, docs
├── CLAUDE.md                     # Project conventions for Claude Code
├── package.json                  # Root workspace config
├── tsconfig.json                 # Base TypeScript config
└── AGENTS.md                     # This file — project conventions
```

## Agent Instructions

- **Think once, execute decisively.** Do not reconsider, second-guess, or re-evaluate decisions already made. Plan carefully upfront, then commit to the plan without circling back.
- **Minimize token usage.** No "Actually...", "Wait—", or self-correction loops. If you wrote it, it's intentional unless proven broken by tests or errors.
- **Batch related file operations.** Write all files in one pass rather than creating, reading back, then editing.
- **Never re-read files you just wrote.** Trust your output. Only re-read when debugging real failures.
- **Skip explanation of your own prior choices.** Only explain when the user asks. No self-commentary like "I noticed that..." or "The issue is that..." unless responding to a specific error.
- **Use simple short to the point english** explain with short and simple english.

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

## MCP Servers (Claude Code)

| MCP        | Purpose                          |
| ---------- | -------------------------------- |
| postgres   | Query and inspect database       |
| github     | PRs, issues, repo management     |
| playwright | Browser testing for landing page |

## Custom Claude Code Commands

- `/dev` — Start all Docker services
- `/migrate` — Run Drizzle migrations
- `/db-push` — Push schema changes (dev only)
