# Yay Thal Pya Zat

Fresh water delivered to your door — a full-stack water delivery platform with PWA, REST API, real-time WebSocket notifications, and admin dashboard.

## Status

| Layer        | Status      |
| ------------ | ----------- |
| Frontend PWA | ✅ Complete  |
| Backend API  | ✅ Complete  |
| Real-time    | ✅ Complete  |
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
| Auth      | better-auth (JWT)                         |
| Runtime   | Node.js 22                                |
| Monorepo  | npm workspaces                            |

## Getting Started

### Prerequisites

- Node.js 22+
- Docker & Docker Compose
- npm 10+

### Quick Start (Docker)

```bash
git clone <repo-url>
cd water-delivery
docker compose up -d --build
```

### Services

| Service  | Port | URL                          |
| -------- | ---- | ---------------------------- |
| Web      | 3005 | http://localhost:3005         |
| API      | 3006 | http://localhost:3006         |
| Postgres | 5433 | localhost:5433               |
| Redis    | 6380 | localhost:6380               |

## Features

### User
- Browse products and subscription plans
- Add to cart and checkout
- Upload payment proof
- Schedule delivery after admin approval
- Use subscription coupons for 20L bottle delivery
- Real-time order status notifications

### Admin
- Dashboard with stats (orders, revenue, users, subscriptions)
- Order management with status workflow validation
- Bulk assignment of orders to delivery persons
- Product, subscription, schedule, and user CRUD
- Real-time toast notifications for new orders

### Delivery Person
- View assigned orders
- Mark orders as delivered

## Order Status Workflow

```
Retail/Coupon: pending → paid → approved → scheduled → assigned → delivered
Subscription:  pending → paid → approved (terminal)
```

## Project Structure

```
water-delivery/
├── apps/
│   ├── api/           # Hono API + Socket.IO (port 3001)
│   └── web/           # Next.js PWA (port 3000)
├── packages/
│   ├── db/            # Drizzle ORM + schema
│   └── shared/        # Shared types
├── docker-compose.yml
└── docs/              # System documentation
```

## License

Private
