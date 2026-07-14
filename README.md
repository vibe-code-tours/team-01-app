# 💧 Yay Thal Pya Zat

Fresh water delivered to your door — a full-stack water delivery platform with landing page SPA, REST API, real-time WebSocket support, and mobile app (Flutter).

## Status

| Layer        | Status      |
| ------------ | ----------- |
| Frontend SPA | ✅ Complete  |
| Backend API  | 🔨 In Progress |
| Mobile App   | 📋 Planned   |

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
| Mobile    | Flutter + Dart                            |
| Runtime   | Node.js 22                                |
| Monorepo  | npm workspaces                            |

## Project Structure

```
water-delivery/
├── apps/
│   ├── api/                    # Hono API server
│   │   └── src/
│   │       ├── index.ts        # Entry: Hono + Socket.IO + HTTP
│   │       ├── config/env.ts   # Environment variables
│   │       ├── routes/         # auth.ts, health.ts
│   │       ├── middleware/     # auth.ts, error.ts
│   │       └── ws/index.ts    # Socket.IO handlers
│   └── web/                    # Next.js landing page SPA
│       └── src/
│           ├── app/            # App Router pages (6 pages)
│           └── components/     # Navbar, Footer, ThemeToggle
├── packages/
│   ├── db/                     # Drizzle ORM schema + connection
│   └── shared/                 # Shared types & constants
├── slides/
│   └── pitch.md               # PechaKucha pitch deck (6 slides)
├── .claude/                    # Claude Code config, commands, docs
├── CLAUDE.md                   # Project conventions for Claude Code
├── docker-compose.yml          # Full stack orchestration
└── package.json                # Root workspace config
```

## Getting Started

### Prerequisites

- Node.js 22+
- Docker & Docker Compose
- npm 10+

### Quick Start (Docker)

```bash
# Clone the repo
git clone <repo-url>
cd water-delivery

# Start all services
docker compose up -d --build
```

### Services

| Service  | Host Port | URL                          | Description             |
| -------- | --------- | ---------------------------- | ----------------------- |
| Web      | 3003      | http://localhost:3003         | Next.js landing page    |
| API      | 3002      | http://localhost:3002         | Hono REST API           |
| Postgres | 5433      | localhost:5433               | PostgreSQL database     |
| Redis    | 6380      | localhost:6380               | Redis cache             |

> **Note:** Host ports are remapped to avoid conflicts with Cursor/OrbStack MCP servers running on default ports. Container ports remain standard (5432, 6379, 3001, 3000).

Browse the database with Drizzle Studio:

```bash
npm run db:studio
```

Then open [https://local.drizzle.studio](https://local.drizzle.studio) in your **Mac browser** (not inside the container).

**Devcontainer note:** Drizzle Studio's UI is hosted at `local.drizzle.studio` and connects to a local API on port `4983`. Cursor does not always auto-forward that port, so open the **Ports** tab and make sure `4983` is forwarded before opening the URL. If the page loads but cannot connect, allow local/private network access in your browser.

### Local Development (without Docker)

```bash
# Install dependencies
npm install

# Start only infrastructure
docker compose up postgres redis -d

# Start API
npm run dev:api

# Start Web
npm run dev:web
```

## Available Scripts

### Features

- ✅ Responsive design (mobile-first)
- ✅ Dark/light mode toggle with persisted preference
- ✅ DaisyUI theme system
- ✅ FOUC prevention (no flash on theme load)

## Claude Code Integration

### MCP Servers

| MCP        | Purpose                          |
| ---------- | -------------------------------- |
| postgres   | Query and inspect database       |
| github     | PRs, issues, repo management     |
| playwright | Browser testing for landing page |

### Domain Specialists

- **Backend** — Hono + Socket.IO specialist
- **Frontend** — Next.js + DaisyUI specialist
- **Database** — PostgreSQL + Drizzle specialist

## Roadmap

### Frontend — Landing Page (SPA) ✅

- [x] Home page with hero section and "Why Choose Us"
- [x] Products page — 6 water products with details and pricing
- [x] Subscription page — 3 plans (Basic, Standard, Premium)
- [x] Pricing page — add-ons table and enterprise CTA
- [x] About page — mission, stats, company values
- [x] Contact page — contact form with client-side state
- [x] Navbar — sticky header with mobile responsive dropdown
- [x] Footer — 4-column layout with links
- [x] DaisyUI theming (light + dark)
- [x] Dark/light mode toggle with localStorage persistence
- [x] Tailwind CSS v4 responsive design

### Backend API 🔨

- [ ] Product CRUD endpoints (list, get, create, update, delete)
- [ ] Subscription plan endpoints
- [ ] Order management (create, list, status updates)
- [ ] Customer profile management
- [ ] Driver assignment and tracking
- [ ] Payment integration
- [ ] Rate limiting and request validation
- [ ] API documentation (OpenAPI/Swagger)
- [ ] Email notification service
- [ ] Admin dashboard endpoints

### Mobile App (Flutter) 📋

- [ ] Project setup with Flutter + Dart
- [ ] Authentication screens (login, register, forgot password)
- [ ] Home screen with product catalog
- [ ] Product detail screen
- [ ] Subscription plan selection
- [ ] Order placement and tracking
- [ ] User profile and order history
- [ ] Push notifications
- [ ] Payment integration
- [ ] Driver app (route optimization, delivery confirmation)
- [ ] Offline support and caching

## License

Private
