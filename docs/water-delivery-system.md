# Water Delivery System — API & Features

## Overview

Water delivery management system (Yay Thal Pya Zat) with manual payment approval workflow. PWA (mobile-first) with real-time notifications via Socket.IO.

---

## Parties

| Party | Description |
|-------|-------------|
| **Admin** | System administrator with role-based access (super-admin, admin) |
| **User** | Customer who buys products/subscriptions |
| **Delivery Person** | Delivers orders, has limited dashboard at `/delivery` |

---

## Products

### Retail Products
| Product | Pack Size |
|---------|-----------|
| 350ml Water | 12 bottles |
| 500ml Water | 12 bottles |
| 1L Water | 12 bottles |
| 1.5L Water | 12 bottles |
| Water Pump | Single unit |
| Stainless Bottle 500ml | 500ml |
| Stainless Bottle 1L | 1L |

### Subscriptions (20L Bottles Only)
| Package | Coupons | Price |
|---------|---------|-------|
| Starter | 5 coupons | 50,000 MMK |
| Regular | 12 coupons | 100,000 MMK |
| Premium | 24 coupons | 180,000 MMK |

> 1 coupon = 1 bottle of 20L water

---

## Order Types & Status Workflow

### Type 1: Retail Order
Products bought from the store (bottles, pumps, accessories).

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          RETAIL ORDER WORKFLOW                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────┐   User    ┌─────────┐   Admin   ┌──────────┐   User    ┌────────────┐ │
│  │ PENDING │ ────────→ │  PAID   │ ────────→ │ APPROVED │ ────────→ │ SCHEDULED  │ │
│  │         │  uploads  │         │  reviews  │          │  books    │            │ │
│  │         │  proof +   │         │  proof    │          │  delivery │            │ │
│  │         │  confirms  │         │           │          │  slot     │            │ │
│  └────┬────┘           └────┬────┘           └────┬─────┘           └─────┬──────┘ │
│       │                     │                     │                       │        │
│       │ User                │ Admin               │                       │ Admin  │
│       │ cancels             │ rejects             │                       │ assigns│
│       ↓                     ↓                     ↓                       ↓        │
│  ┌──────────┐         ┌──────────┐         ┌──────────┐             ┌──────────┐ │
│  │CANCELLED │         │ REJECTED │         │CANCELLED │             │ ASSIGNED │ │
│  └──────────┘         └──────────┘         └──────────┘             └────┬─────┘ │
│                                                                          │       │
│                                                                  Delivery Person  │
│                                                                  marks delivered   │
│                                                                          │       │
│                                                                          ↓       │
│                                                                    ┌──────────┐ │
│                                                                    │DELIVERED │ │
│                                                                    └──────────┘ │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Type 2: Subscription Order
Monthly coupon plans (Starter/Regular/Premium). No delivery scheduling — just coupon issuance.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       SUBSCRIPTION ORDER WORKFLOW                           │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────┐   User    ┌─────────┐   Admin   ┌──────────┐                  │
│  │ PENDING │ ────────→ │  PAID   │ ────────→ │ APPROVED │ ← TERMINAL      │
│  │         │  uploads  │         │  reviews  │          │   Coupons issued │
│  │         │  proof +   │         │  proof    │          │   to user        │
│  │         │  confirms  │         │           │          │                  │
│  └────┬────┘           └────┬────┘           └──────────┘                  │
│       │                     │                                              │
│       │ User                │ Admin                                        │
│       │ cancels             │ rejects                                      │
│       ↓                     ↓                                              │
│  ┌──────────┐         ┌──────────┐                                        │
│  │CANCELLED │         │ REJECTED │                                        │
│  └──────────┘         └──────────┘                                        │
│                                                                             │
│  After approval: User uses coupons to create coupon-delivery orders.        │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Type 3: Coupon Delivery
User uses subscription coupons to order 20L water bottles.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                      COUPON DELIVERY WORKFLOW                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌───────────┐  User     ┌──────────┐  Admin    ┌──────────┐              │
│  │ SCHEDULED │ ────────→ │ ASSIGNED │ ────────→ │DELIVERED │              │
│  │           │  selects  │          │  assigns  │          │              │
│  │           │  slot +   │          │  delivery │          │              │
│  │           │  enters   │          │  person   │          │              │
│  │           │  address  │          │           │          │              │
│  └─────┬─────┘          └──────────┘           └──────────┘              │
│        │                                                                    │
│        │ User cancels                                                       │
│        ↓                                                                    │
│  ┌──────────┐                                                               │
│  │CANCELLED │  Coupons returned to user                                     │
│  └──────────┘                                                               │
│                                                                             │
│  Note: Coupon deliveries skip "pending" and "paid" — no payment needed.    │
│  Note: Only "scheduled" and "pending" can be cancelled.                    │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Status definitions:**
| Status | Description |
|--------|-------------|
| `pending` | Order placed, awaiting user payment proof |
| `paid` | User uploaded proof + confirmed, awaiting admin |
| `approved` | Admin verified payment (or subscription approved) |
| `rejected` | Payment rejected (user can re-upload) |
| `scheduled` | User booked delivery slot (after admin approval) |
| `assigned` | Admin assigned to delivery person |
| `delivered` | Delivery person marked completed |
| `cancelled` | Cancelled by user |

**Key rules:**
- User schedules delivery AFTER admin approval (not admin)
- Admin cannot transition `approved → scheduled` (user does this)
- Subscription orders: terminal at `approved` (no schedule/assign)
- Only `pending` and `scheduled` coupon deliveries can be cancelled
- Backend validates all transitions — invalid transitions return 400

**User Flow (Retail Order):**
1. User places order → status: `pending`
2. User uploads payment proof → status stays `pending`
3. User clicks "Confirm Payment" → status changes to `paid`
4. Admin reviews and approves → status changes to `approved`
5. User books delivery slot → status changes to `scheduled`
6. Admin assigns to delivery person → status changes to `assigned`
7. Delivery person marks delivered → status changes to `delivered`

**User Flow (Subscription Purchase):**
1. User selects subscription package → order created → status: `pending`
2. User uploads payment proof → status: `paid`
3. Admin approves → coupons issued to user → status: `approved` (terminal)
4. User uses coupons to order 20L bottles (separate coupon-delivery orders)

**User Flow (Coupon Delivery):**
1. User selects schedule and enters delivery details → order created → status: `scheduled`
2. Admin assigns to delivery person → status: `assigned`
3. Delivery person marks delivered → status: `delivered`

**Cancellation Policy:**
- Retail orders: User can cancel while in `pending` status only
- Coupon deliveries: User can cancel while in `pending` or `scheduled` status
- Once `assigned` or `delivered`, order cannot be cancelled by user
- Admin can cancel any order that is not `delivered`

---

## API Endpoints

### Authentication (better-auth)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/auth/sign-up/email` | Register | No |
| POST | `/api/auth/sign-in/email` | Login | No |
| POST | `/api/auth/sign-out` | Sign out | Yes |
| GET | `/api/auth/get-session` | Get session | Yes |

### Admin — Stats

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/admin/stats` | Dashboard statistics | Admin |
| GET | `/api/admin/me` | Current admin info | Admin |

### Admin — Users

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/admin/users` | List users (paginated, searchable) | Admin |
| GET | `/api/admin/users/:id` | Get user details | Admin |
| POST | `/api/admin/users` | Create user | Super Admin |
| PATCH | `/api/admin/users/:id` | Update user | Super Admin |
| DELETE | `/api/admin/users/:id` | Suspend user | Super Admin |

### Admin — Products

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/admin/products` | List products (paginated, filterable) | Admin |
| GET | `/api/admin/products/:id` | Get product details | Admin |
| POST | `/api/admin/products` | Create product | Super Admin |
| PATCH | `/api/admin/products/:id` | Update product | Super Admin |
| POST | `/api/admin/products/:id/image` | Upload product image | Super Admin |
| DELETE | `/api/admin/products/:id` | Deactivate product | Super Admin |

### Admin — Orders

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/admin/orders` | List orders (filterable by status/type) | Admin |
| GET | `/api/admin/orders/:id` | Get order details | Admin |
| PATCH | `/api/admin/orders/:id` | Update status (with transition validation) | Admin |
| GET | `/api/admin/delivery-persons` | List delivery persons | Admin |
| POST | `/api/admin/assignments/bulk` | Bulk assign orders to delivery person | Admin |
| GET | `/api/admin/assignable` | List orders ready for assignment | Admin |
| GET | `/api/admin/assigned/:dpId` | List orders assigned to delivery person | Admin |
| PATCH | `/api/admin/orders/:id/deliver` | Mark as delivered | Delivery |

### Admin — Subscriptions

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/admin/subscriptions` | List user subscriptions | Admin |
| GET | `/api/admin/subscriptions/:id` | Get subscription details | Admin |

### Admin — Subscription Packages

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/admin/subscription-packages` | List packages | Admin |
| GET | `/api/admin/subscription-packages/:id` | Get package details | Admin |
| POST | `/api/admin/subscription-packages` | Create package | Super Admin |
| PATCH | `/api/admin/subscription-packages/:id` | Update package | Super Admin |
| DELETE | `/api/admin/subscription-packages/:id` | Delete package | Super Admin |

### Admin — Locations

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/admin/provinces` | List provinces | Admin |
| POST | `/api/admin/provinces` | Create province | Super Admin |
| PATCH | `/api/admin/provinces/:id` | Update province | Super Admin |
| DELETE | `/api/admin/provinces/:id` | Delete province | Super Admin |
| GET | `/api/admin/townships` | List townships | Admin |
| POST | `/api/admin/townships` | Create township | Super Admin |
| PATCH | `/api/admin/townships/:id` | Update township | Super Admin |
| DELETE | `/api/admin/townships/:id` | Delete township | Super Admin |

### Admin — Schedules

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/admin/schedules` | List schedules | Admin |
| GET | `/api/admin/schedules/:id` | Get schedule details | Admin |
| POST | `/api/admin/schedules` | Create schedule (multi-date, multi-township) | Super Admin |
| PATCH | `/api/admin/schedules/:id` | Update schedule | Super Admin |
| DELETE | `/api/admin/schedules/:id` | Delete schedule | Super Admin |

### Public — Products

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/products` | List active products | No |
| GET | `/api/products/:id` | Get product details | No |

### Public — Subscription Packages

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/subscription-packages` | List active packages | No |
| GET | `/api/subscription-packages/:id` | Get package details | No |

### Public — Locations

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/provinces/list` | List active provinces | No |
| GET | `/api/townships-by-province/:id` | List townships for province | No |

### User — Profile

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/user/profile` | Get my profile | Yes |
| PATCH | `/api/user/profile` | Update my profile | Yes |

### User — Orders

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/user/orders` | List my orders | Yes |
| GET | `/api/user/orders/:id` | Get order details | Yes |
| POST | `/api/user/orders` | Create retail order (from cart) | Yes |
| PATCH | `/api/user/orders/:id` | Update status (confirm payment / cancel) | Yes |
| POST | `/api/user/orders/:id/payment-proof` | Upload payment proof image | Yes |
| POST | `/api/user/orders/:orderId/schedule` | Book delivery slot | Yes |

### User — Subscriptions

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/user/subscriptions` | List my subscriptions | Yes |
| GET | `/api/user/subscriptions/:id` | Get subscription details | Yes |
| POST | `/api/user/subscriptions/purchase` | Purchase subscription | Yes |

### User — Coupon Deliveries

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/user/coupon-deliveries` | List my coupon deliveries | Yes |
| GET | `/api/user/coupon-deliveries/:id` | Get delivery details | Yes |
| POST | `/api/user/coupon-deliveries` | Create coupon delivery (uses coupons) | Yes |
| PATCH | `/api/user/coupon-deliveries/:id` | Cancel delivery | Yes |

### User — Schedules

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/user/schedules` | Get available delivery slots | Yes |

### User — Notifications

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/user/notifications` | List notifications | Yes |
| GET | `/api/user/notifications/unread-count` | Get unread count | Yes |
| PATCH | `/api/user/notifications/:id/read` | Mark as read | Yes |
| PATCH | `/api/user/notifications/read-all` | Mark all as read | Yes |

---

## Real-Time (Socket.IO)

### Connection
- Client connects via `/api/socket-io/` (Next.js proxy → API server)
- Auth: `auth: { token }` — session token from `GET /api/auth/socket-token`
- Transport: polling (with upgrade attempt)
- Reconnection: 10 attempts, 1s-5s delay, 10s timeout
- Connection managed by `connectSocket()` / `getSocket()` / `onSocketReady()` in `apps/web/src/lib/socket.ts`

### Rooms
- `user:{userId}` — each user gets their own room (for personal notifications)
- `admins` — all admin/super-admin users join this room (for order broadcasts)

### Notification Types

| Type | Description | Emitted When |
|------|-------------|-------------|
| `order_created` | New order placed | User creates retail/subscription order |
| `order_status_changed` | Order status updated | Admin approves/rejects, user cancels/confirms, delivery completed |
| `delivery_created` | Coupon delivery created | User creates coupon delivery |
| `delivery_status_changed` | Delivery status updated | Admin assigns driver, delivery completed |
| `subscription_purchased` | Subscription bought | User purchases subscription |
| `subscription_approved` | Subscription approved | Admin approves subscription payment |

### Server Events

| Event | Target | Payload | Trigger |
|-------|--------|---------|---------|
| `notification:new` | `user:{userId}` | Notification object | Any notification created |
| `order:status-changed` | `user:{userId}` | `{ orderId }` | User's order status changes |
| `order:new` | `admins` | `{ orderId, type }` | New order placed |
| `order:status-changed` | `admins` | `{ orderId, status }` | Any order status changes |
| `delivery:new` | `admins` | `{ count }` | Orders assigned in bulk |
| `delivery:status-changed` | `admins` | `{ orderId, status }` | Delivery completed |

### Emission Points

| Route | Event Emitted | Target |
|-------|--------------|--------|
| `POST /user/orders` | `order:new` | admins |
| `PATCH /user/orders/:id` (confirm/cancel) | `order:status-changed` | user + admins |
| `PATCH /admin/orders/:id` (approve/reject) | `order:status-changed` | user + admins |
| `POST /admin/assignments/bulk` | `delivery:new` | admins |
| `PATCH /admin/orders/:id/deliver` | `order:status-changed` | user + admins |
| `POST /user/coupon-deliveries` | `delivery:new` | admins |
| `POST /user/subscriptions/purchase` | `order:new` | admins |

### Client-Side Behavior

**Admin pages:**
- `admin/layout.tsx` — listens for `order:new`, `order:status-changed` → shows toast notification
- `admin/page.tsx` (dashboard) — listens for same events → refreshes stats
- `admin/orders/page.tsx` — listens for same events → refreshes order list

**User pages:**
- `dashboard/page.tsx` — listens for `order:status-changed`, `delivery:status-changed` → refreshes order list
- `orders/[id]/page.tsx` — listens for same events → refreshes order detail (only if orderId matches)
- `NotificationBell` — shows unread count badge, marks as read on click

### Flow Example: Admin Approves Order

```
1. Admin clicks "Approve" → PATCH /api/admin/orders/:id { status: "approved" }
2. Backend updates DB status
3. Backend creates notification (DB insert)
4. Backend emits "notification:new" to user:{userId} room
5. Backend emits "order:status-changed" to user:{userId} room
6. Backend emits "order:status-changed" to admins room
7. User's socket receives event → loadOrder() → page updates
8. Admin's socket receives event → loadOrders() → list refreshes
9. User's NotificationBell receives notification:new → badge count updates
```

---

## Features

### Admin

- **Dashboard**: Stats (users, orders, revenue, subscriptions), recent orders
- **Order Management**: List/filter orders, approve/reject/cancel, view details
- **Assignment Panel**: Filter by province/township, multi-select orders, bulk assign to delivery person
- **Product Management**: CRUD with image upload
- **Subscription Package Management**: CRUD
- **Schedule Management**: Create multi-date, multi-township schedules
- **User Management**: CRUD, suspend
- **Real-time**: Toast notifications for new orders and status changes

### User

- **Dashboard**: Coupons, pending deliveries, order count, recent orders
- **Product Browsing**: Filter by type (bottles, dispensers, retail)
- **Cart & Checkout**: Add to cart, place order
- **Payment**: Upload proof, confirm payment
- **Scheduling**: Select delivery slot after admin approval
- **Subscription**: Purchase plans, view coupons
- **Coupon Delivery**: Use coupons for 20L bottle delivery
- **Notifications**: Bell icon with unread count, mark as read
- **Real-time**: Auto-refresh orders on status changes

### Delivery Person

- **Dashboard** (`/delivery`): View assigned orders, stats
- **Actions**: Mark order as delivered

---

## Database Schema

### Core
- **users** — id, name, email, phone, address, province_id, township_id, role, status
- **products** — id, name, description, price, type, pack_size, image_url, status
- **subscription_packages** — id, name, coupon_count, price, description, status
- **orders** — id, user_id, order_type, total_amount, status, payment_proof_url, payment_details, bottle_count, admin_notes, delivery_person_id, assigned_at
- **order_items** — id, order_id, product_id, quantity, unit_price, subtotal
- **subscriptions** — id, user_id, package_id, coupons_remaining, expires_at

### Location
- **provinces** — id, name, is_active
- **townships** — id, province_id, name, is_active

### Delivery
- **schedules** — id, province_id, date, time_start, time_end, max_orders, current_orders, is_province_wide
- **schedule_townships** — schedule_id, township_id
- **order_schedules** — order_id, schedule_id, township_id, delivery_address, contact_phone, notes
- **delivery_persons** — id, user_id, name, phone, province_id, status

### Notifications
- **notifications** — id, user_id, type, title, message, entity_type, entity_id, link, read, created_at

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 15 + DaisyUI v5 + Tailwind CSS v4 |
| Backend | Hono v4 + @hono/node-server |
| ORM | Drizzle ORM |
| Database | PostgreSQL 16 |
| Cache | Redis 7 |
| Real-time | Socket.IO v4 |
| Auth | better-auth (JWT) |
| Runtime | Node.js 22 |
| Brand | YTPZ Brand Guide v1.0 |

---

## Routing Structure

```
apps/api/src/
├── index.ts              # Mount all routers + Socket.IO
├── config/env.ts         # Environment variables
├── lib/
│   ├── auth.ts           # better-auth config
│   ├── io.ts             # Socket.IO instance getter
│   └── notifications.ts  # Notification + socket emission helpers
├── middleware/
│   ├── auth.ts           # Session verification
│   └── error.ts          # Error handler
├── routes/
│   ├── admin.ts          # /api/admin/stats, /me, /users (CRUD)
│   ├── products.ts       # /api/admin/products (CRUD + image upload)
│   ├── orders.ts         # /api/admin/orders, assignments, delivery
│   ├── subscriptions.ts  # /api/admin/subscriptions
│   ├── subscription-packages.ts  # /api/admin/subscription-packages
│   ├── provinces.ts      # /api/admin/provinces
│   ├── townships.ts      # /api/admin/townships
│   ├── schedules.ts      # /api/admin/schedules
│   ├── public.ts         # /api/products, subscription-packages, locations (no auth)
│   ├── user.ts           # /api/user/profile
│   ├── user-orders.ts    # /api/user/orders, payment-proof, schedule
│   ├── user-coupon-deliveries.ts  # /api/user/coupon-deliveries
│   └── notifications.ts  # /api/user/notifications
└── ws/
    └── index.ts          # Socket.IO setup (auth middleware, room joins)
```
