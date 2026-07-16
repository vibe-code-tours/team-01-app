# Claude Code Tools — MCP, Skills & Agents

This document describes all Claude Code integrations used in the Water Delivery project.

---

## MCP Servers

Configured in `.mcp.json`. These give Claude Code direct access to external tools.

| MCP | Package | Purpose |
|-----|---------|---------|
| **postgres** | `@modelcontextprotocol/server-postgres` | Query and inspect PostgreSQL database directly via SQL |
| **github** | `@modelcontextprotocol/server-github` | Manage PRs, issues, branches, and repo operations via GitHub API |
| **playwright** | `@playwright/mcp` | Browser automation for testing the landing page and UI |

### postgres
- **Connection**: `postgresql://postgres:postgres@localhost:5433/water_delivery`
- **Use cases**: Inspect table data, check migration status, verify seed data, debug query results
- **Example**: `mcp__postgres__query` — run raw SQL against the database

### github
- **Auth**: `GITHUB_PERSONAL_ACCESS_TOKEN` env var
- **Use cases**: Create/update PRs, list issues, manage branches, check CI status
- **Example**: `mcp__github__create_pull_request`, `mcp__github__list_issues`

### playwright
- **Mode**: headless (default), can switch to headed for visual debugging
- **Use cases**: Test page rendering, verify UI changes, screenshot comparison, form testing
- **Example**: `mcp__playwright__browser_navigate`, `mcp__playwright__browser_take_screenshot`

---

## Domain Agents

Located in `.claude/agents/`. These are specialized sub-agents that focus on specific parts of the codebase.

| Agent | Focus | Tools |
|-------|-------|-------|
| **backend-agent** | Hono API, Socket.IO, Drizzle ORM | Read, Write, Edit, Bash, Glob, Grep |
| **frontend-agent** | Next.js 15, DaisyUI v5, Tailwind CSS v4 | Read, Write, Edit, Bash, Glob, Grep |
| **database-agent** | PostgreSQL schema, Drizzle migrations, Redis | Read, Write, Edit, Bash, Glob, Grep, `mcp__postgres__query` |

### backend-agent
- **Expertise**: Hono v4 routes, Socket.IO real-time, Drizzle ORM queries, better-auth
- **Codebase**: `apps/api/src/` (routes, middleware, ws, lib)
- **Conventions**: Response format `{ success, data?, error? }`, auth middleware, Socket.IO rooms

### frontend-agent
- **Expertise**: Next.js 15 App Router, DaisyUI v5 components, React server/client components
- **Codebase**: `apps/web/src/` (app, components, lib)
- **Conventions**: `"use client"` only when needed, DaisyUI classes, `@/` path alias

### database-agent
- **Expertise**: PostgreSQL 16, Drizzle ORM schema, migrations, Redis
- **Codebase**: `packages/db/src/` (schema, migrations, db.ts)
- **Conventions**: `pgTable()`, `uuid()` PKs, `pgEnum()` for enums, one table per file

---

## Skills

Located in `.claude/skills/`. These provide reusable knowledge for common tasks.

| Skill | Description |
|-------|-------------|
| **dev** | Start all Docker development services with hot-reload |
| **docker-compose** | Docker Compose operations — start, stop, logs, shell access |
| **ui-ux-pro-max** | Design intelligence — 50+ styles, 161 color palettes, UX guidelines (installed via plugin) |

### dev
- Runs `docker compose up --build` to start PostgreSQL, Redis, API, and Web
- Checks all 5 services are healthy

### docker-compose
- Start/stop services, view logs, shell access into containers
- Health check commands
- Volume management

### ui-ux-pro-max
- Design system recommendations based on product type
- Color palette, typography, and style suggestions
- UX guidelines for forms, navigation, animations, accessibility
- Used for brand guide implementation and UI reviews

---

## Custom Commands

Located in `.claude/commands/`. Slash commands for quick actions.

| Command | Action |
|---------|--------|
| `/dev` | Start all Docker services |
| `/migrate` | Run Drizzle migrations (`docker compose exec api npx drizzle-kit migrate`) |
| `/db-push` | Push schema changes directly (`docker compose exec api npx drizzle-kit push`) |

---

## Reference Docs

Located in `.claude/docs/` (if present). Domain-specific reference material.

---

## How They Work Together

```
User request
    │
    ├─→ Domain Agent selected (backend/frontend/database)
    │       ├─→ MCP tools (postgres, github, playwright)
    │       └─→ Skills (dev, docker-compose, ui-ux-pro-max)
    │
    └─→ Custom Commands (/dev, /migrate, /db-push)
```

**Example workflows:**
- "Fix the login bug" → **frontend-agent** → reads/writes `apps/web/`
- "Check order data" → **database-agent** → uses `mcp__postgres__query`
- "Create a PR" → uses `mcp__github__create_pull_request`
- "Test the homepage" → uses `mcp__playwright__browser_*`
- "Start dev environment" → `/dev` command → `docker compose up --build`
