# Water Delivery System — API & Features

## Overview

Water delivery management system with manual payment approval workflow. MVP delivered as PWA (mobile-first), future Flutter mobile app.

---

## Parties

| Party | Description |
|-------|-------------|
| **Admin** | System administrator with role-based access |
| **User** | Customer who buys products/subscriptions |
| **Delivery Person** | Delivers orders, limited dashboard access |

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
| Stainless Bottle | Various sizes |

### Subscriptions (20L Bottles Only)
| Package | Coupons |
|---------|---------|
| Starter | 5 coupons |
| Regular | 12 coupons |
| Premium | 24 coupons |

> 1 coupon = 1 bottle of 20L water
> Subscription orders start at `approved` status — no payment proof needed

---

## API Endpoints

### Authentication (better-auth)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/auth/sign-up/email` | Register with email/password | No |
| POST | `/api/auth/sign-in/email` | Login with email/password | No |
| POST | `/api/auth/sign-out` | Sign out (invalidate session) | Yes |
| GET | `/api/auth/get-session` | Get current session + user + coupons | Yes |
| POST | `/api/auth/update-user` | Update user profile | Yes |
| POST | `/api/auth/change-password` | Change password | Yes |
| POST | `/api/auth/passkey/register` | Register passkey (WebAuthn) | Yes |
| POST | `/api/auth/passkey/authenticate` | Login with passkey | No |
| POST | `/api/auth/authenticator/enable` | Enable TOTP authenticator | Yes |
| POST | `/api/auth/authenticator/verify` | Verify TOTP code | Yes |
| POST | `/api/auth/authenticator/disable` | Disable authenticator | Yes |

**better-auth handles:**
- JWT session management
- Password hashing (bcrypt)
- Passkey (WebAuthn/FIDO2)
- Authenticator (TOTP)
- Role-based access via middleware

### Users (Admin)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/admin/users` | List all users | Admin |
| GET | `/api/admin/users/:id` | Get user details | Admin |
| PUT | `/api/admin/users/:id` | Update user | Admin |
| PUT | `/api/admin/users/:id/status` | Enable/disable user | Admin |
| GET | `/api/admin/users/:id/orders` | Get user orders | Admin |

### Products (Admin)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/admin/products` | List all products | Admin |
| POST | `/api/admin/products` | Create product | Admin |
| GET | `/api/admin/products/:id` | Get product details | Admin |
| PUT | `/api/admin/products/:id` | Update product | Admin |
| DELETE | `/api/admin/products/:id` | Delete product | Admin |
| PATCH | `/api/admin/products/:id/status` | Enable/disable product | Admin |

### Products (Public)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/products` | List active products | No |
| GET | `/api/products/:id` | Get product details | No |

### Subscriptions (Admin)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/admin/subscriptions` | List all subscription packages | Admin |
| POST | `/api/admin/subscriptions` | Create subscription package | Admin |
| GET | `/api/admin/subscriptions/:id` | Get package details | Admin |
| PUT | `/api/admin/subscriptions/:id` | Update package | Admin |
| DELETE | `/api/admin/subscriptions/:id` | Delete package | Admin |

### Subscriptions (Public)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/subscriptions` | List active subscription packages | No |
| GET | `/api/subscriptions/:id` | Get package details | No |

### Subscriptions (User)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/user/subscriptions` | List my subscriptions | Yes |
| POST | `/api/user/subscriptions/purchase` | Purchase subscription package | Yes |
| GET | `/api/user/subscriptions/:id` | Get subscription details + remaining coupons | Yes |

### Orders (Admin)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/admin/orders` | List all orders | Admin |
| GET | `/api/admin/orders/:id` | Get order details | Admin |
| PUT | `/api/admin/orders/:id` | Update order status | Admin |
| PATCH | `/api/admin/orders/:id/assign` | Assign delivery person | Admin |
| PATCH | `/api/admin/orders/:id/approve-payment` | Approve manual payment | Admin |
| PATCH | `/api/admin/orders/:id/reject-payment` | Reject payment proof | Admin |

### Orders (User)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/user/orders` | List my orders | Yes |
| POST | `/api/user/orders` | Create order | Yes |
| GET | `/api/user/orders/:id` | Get order details | Yes |
| POST | `/api/user/orders/:id/payment` | Upload payment proof | Yes |
| POST | `/api/user/orders/:id/cancel` | Cancel order (before delivered) | Yes |

### Location Management (Admin)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/admin/provinces` | List all provinces | Admin |
| POST | `/api/admin/provinces` | Create province | Admin |
| PUT | `/api/admin/provinces/:id` | Update province | Admin |
| DELETE | `/api/admin/provinces/:id` | Delete province | Admin |
| GET | `/api/admin/provinces/:id/townships` | List townships in province | Admin |
| POST | `/api/admin/provinces/:id/townships` | Create township | Admin |
| PUT | `/api/admin/townships/:id` | Update township | Admin |
| DELETE | `/api/admin/townships/:id` | Delete township | Admin |

### Delivery Schedule (Admin)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/admin/schedules` | List delivery schedules | Admin |
| POST | `/api/admin/schedules` | Create schedule | Admin |
| PUT | `/api/admin/schedules/:id` | Update schedule | Admin |
| DELETE | `/api/admin/schedules/:id` | Delete schedule | Admin |

**Schedule creation payload:**
```json
{
  "province_id": "uuid",
  "date": "2026-07-10",
  "time_start": "09:00",
  "time_end": "12:00",
  "max_orders": 50,
  "is_province_wide": true,
  "township_ids": ["uuid1", "uuid2"] // used when is_province_wide = false
}
```

**Scheduling Logic:**
- If `is_province_wide = true`: schedule applies to ALL townships in the province
- If `is_province_wide = false`: schedule only applies to selected `township_ids`
- When user queries available slots, they must provide both `province_id` and `township_id`
- System returns schedules that match: province-wide OR specific township

### Delivery Schedule (User)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/user/schedules/available?province_id=&township_id=` | Get available slots (with remaining capacity) | Yes |
| POST | `/api/user/orders/:id/schedule` | Book delivery slot (validates max_orders) | Yes |

**Schedule Booking Validation:**
- Check schedule not fully booked (`current_orders < max_orders`)
- Auto-increment `current_orders` on successful booking

**User schedule booking payload:**
```json
{
  "schedule_id": "uuid",
  "township_id": "uuid",
  "delivery_address": "123 Street",
  "contact_phone": "09xxxxxxxxx",
  "notes": "Leave at gate"
}
```

### Delivery Persons (Admin)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/admin/delivery-persons` | List all delivery persons | Admin |
| POST | `/api/admin/delivery-persons` | Create delivery person | Admin |
| GET | `/api/admin/delivery-persons/:id` | Get details | Admin |
| PUT | `/api/admin/delivery-persons/:id` | Update delivery person | Admin |
| DELETE | `/api/admin/delivery-persons/:id` | Delete delivery person | Admin |
| GET | `/api/admin/delivery-persons?province_id=` | Filter by province | Admin |

### Delivery Person (Shared Admin Dashboard)

Delivery person uses same admin endpoints with role middleware:

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/admin/orders?assigned_to=me` | List my assigned orders | Delivery |
| GET | `/api/admin/orders/:id` | Get order details | Delivery |
| PATCH | `/api/admin/orders/:id/delivered` | Mark as delivered | Delivery |

**Routing:**
- Same `/api/admin/*` routes
- Role middleware checks access per route
- Delivery person: only orders endpoint, read + mark delivered only
- Admin: full access to all endpoints

**Delivery Person Login:**
- Uses same `/api/auth/sign-in/email` endpoint
- Role: `delivery`
- Shares admin dashboard with limited access

### Dashboard (Admin)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/admin/dashboard/stats` | Get dashboard statistics | Admin |
| GET | `/api/admin/dashboard/revenue` | Get revenue report | Admin |
| GET | `/api/admin/dashboard/orders-summary` | Get orders summary | Admin |

---

## Features

### Admin Features

#### Dashboard
- Total orders (pending, approved, delivered)
- Total revenue
- Active users
- Pending payments to review
- Recent orders

#### Product Management (CRUD)
- Create/edit/delete products
- Set product name, description, price, pack size
- Upload product images
- Enable/disable products
- Manage stock status

#### Subscription Management (CRUD)
- Create/edit/delete subscription packages
- Set coupon count and price
- Enable/disable packages
- View subscription holders and their remaining coupons

#### Order Management
- View all orders with filters (status, date, user)
- Approve/reject payment proofs
- Assign orders to delivery persons (filtered by order's province)
- Update order status (pending → paid → approved → scheduled → assigned → delivered)
- View order history

#### User Management
- View all registered users
- View user order history
- Enable/disable user accounts
- View user details

#### Delivery Schedule Management
- CRUD provinces and townships
- Create delivery schedules:
  - **Province-wide**: all townships under province share the schedule
  - **Township-specific**: select one or more townships
- Set date, time range, and max orders per schedule
- View scheduled deliveries per date/province

#### Delivery Person Management
- CRUD delivery persons (name, phone, phone, province)
- Assign orders to delivery persons
- View delivery person's assigned orders
- Track delivery completion

---

### Delivery Person Features

#### Dashboard (Limited)
- View only assigned orders
- Order list with status, customer info, delivery address
- Filter by: pending delivery, delivered today

#### Order Actions
- View order details (items, address, contact phone)
- Mark order as delivered
- Cannot access: products, users, payments, schedules, other orders

---

### User Features

#### Authentication
- Register with: name, email, phone, address, province, township
- Login methods:
  - Email/password
  - Passkey (WebAuthn — fingerprint, Face ID, security key)
  - Authenticator app (Google Authenticator, Authy)
- Session management (via better-auth)
- Profile management

#### Product Browsing
- View all active products
- View product details (name, price, description, pack size)
- Filter by category

#### Shopping
- Add products to cart
- Select quantity
- Place order
- Order summary before checkout

#### Subscription Purchase
- View active subscription packages (5, 12, 24 coupons)
- Purchase subscription via manual payment
- Remaining coupons available in `/api/auth/me` response
- Use coupon to order 20L bottle

#### Payment (Manual)
- Upload payment proof (screenshot/image)
- Enter transaction details (bank, account, amount)
- View payment status (pending, approved, rejected)
- Re-upload if rejected with notes

#### Delivery Scheduling
- Select province → township
- View available delivery slots for that area
- Select date and time range
- Confirm schedule
- View upcoming delivery

#### Order History
- View past orders
- Order status tracking
- Download receipts

---

## Order Status Flow

### Retail Order (manual payment)
```
┌─────────┐    ┌─────────┐    ┌────────────┐    ┌────────────┐    ┌──────────┐    ┌──────────┐
│ Pending │ →  │  Paid   │ →  │  Approved  │ →  │  Scheduled │ →  │ Assigned │ →  │ Delivered│
└─────────┘    └─────────┘    └────────────┘    └────────────┘    └──────────┘    └──────────┘
                     │              │
                     ↓              ↓
                ┌─────────┐   ┌──────────┐
                │Rejected │   │ Cancelled│
                └─────────┘   └──────────┘
```

### Subscription Order (coupon-based)
```
┌─────────┐    ┌─────────┐    ┌──────────┐    ┌────────────┐    ┌──────────┐    ┌──────────┐
│ Pending │ →  │  Paid   │ →  │ Approved │ →  │  Scheduled │ →  │ Assigned │ →  │ Delivered│
└─────────┘    └─────────┘    └──────────┘    └────────────┘    └──────────┘    └──────────┘
                     │              │              │
                     ↓              ↓              ↓
                ┌─────────┐   ┌──────────┐   ┌──────────┐
                │Rejected │   │ Cancelled│   │ Cancelled│
                └─────────┘   └──────────┘   └──────────┘
```

**Status Definitions:**
- `pending` — Order placed, awaiting user to upload payment proof and confirm
- `paid` — User confirmed payment (uploaded proof + clicked "Confirm Payment"), awaiting admin approval
- `approved` — Payment verified by admin (or subscription order using coupon)
- `rejected` — Payment rejected by admin (user can re-upload proof)
- `scheduled` — Delivery date/time booked by user
- `assigned` — Assigned to delivery person by admin
- `delivered` — Delivery person marked as completed
- `cancelled` — Order cancelled by user

**User Flow (Retail Order):**
1. User places order → status: `pending`
2. User uploads payment proof → status stays `pending`
3. User clicks "Confirm Payment" → status changes to `paid`
4. Admin reviews and approves → status changes to `approved`
5. User books delivery slot → status changes to `scheduled`

**Note:** Subscription orders (coupon-based) start at `approved` since payment was already made when purchasing subscription.

**Cancellation Policy:** User can cancel order while in `pending` status only. Once payment is confirmed (`paid`), order cannot be cancelled by user.

---

## Database Entities

### Core Tables

- **users** — id, name, email, phone, address, province_id, township_id, role, status, password_hash, created_at, updated_at
- **products** — id, name, description, price, type (retail/subscription/pump/bottle), pack_size, image_url, status, created_at, updated_at
- **subscription_packages** — id, name, coupon_count, price, description, status, created_at, updated_at
- **orders** — id, user_id, order_type (retail/subscription), total_amount, status, payment_proof_url, payment_details, admin_notes, created_at, updated_at
- **order_items** — id, order_id, product_id, quantity, unit_price, subtotal
- **subscriptions** — id, user_id, package_id, coupons_remaining, status, created_at, expires_at

### Location Tables

- **provinces** — id, name, is_active, created_at
- **townships** — id, province_id, name, is_active, created_at

### Delivery Schedule Tables

- **schedules** — id, province_id, date, time_start, time_end, max_orders, current_orders, is_province_wide, created_at
- **schedule_townships** — id, schedule_id, townships_id (linked when is_province_wide = false)
- **order_schedules** — id, order_id, schedule_id, townships_id, delivery_address, contact_phone, notes

### Delivery Person Tables

- **delivery_persons** — id, user_id, name, phone, province_id, status, created_at
- **order_assignments** — id, order_id, delivery_person_id, assigned_at, delivered_at, status

---

## Order Workflow

### Retail Order
1. User places order → status: `pending`
2. User uploads payment proof → status: `paid`
3. Admin reviews proof:
   - Approve → status: `approved`
   - Reject → status: `rejected` (with reason)
4. If rejected, user re-uploads → status: `paid` again
5. If approved, user schedules delivery → status: `scheduled`
6. Admin assigns to delivery person → status: `assigned`
7. Delivery person marks delivered → status: `delivered`

### Subscription Order (coupon-based)
1. User selects subscription package → order created → status: `pending`
2. User uploads payment proof → status: `paid`
3. Admin approves payment → coupons issued → status: `approved`
4. User orders 20L bottle using coupon → status: `approved` (already paid)
5. User schedules delivery → status: `scheduled`
6. Admin assigns to delivery person → status: `assigned`
7. Delivery person marks delivered → status: `delivered`

---

## MVP Scope (PWA)

| Feature | Priority |
|---------|----------|
| User auth (register/login) | P0 |
| Passkey authentication | P0 |
| Authenticator (TOTP) | P1 |
| Product listing | P0 |
| Shopping cart | P0 |
| Order placement | P0 |
| Payment proof upload | P0 |
| Admin order management | P0 |
| Payment approval workflow | P0 |
| Delivery scheduling (province/township) | P0 |
| Dashboard (admin) | P0 |
| Delivery person management | P0 |
| Delivery person limited dashboard | P0 |
| Mark order as delivered | P0 |
| Subscription purchase | P0 |
| Order history | P1 |
| Responsive mobile UI | P0 |

---

## Future Enhancements (Flutter + Real-time)

- Separate Flutter mobile app
- Real-time order assignment with push notifications
- Route optimization
- Delivery photo proof
- Live delivery tracking
- Multi-language support

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
| Auth | better-auth (JWT + Passkey + TOTP) |
| Runtime | Node.js 22 |
| PWA | next-pwa |
| Future Mobile | Flutter |

---

## Routing Structure

```
apps/api/src/
├── index.ts              # Mount all routers
├── lib/
│   └── auth.ts           # better-auth config
├── middleware/
│   ├── auth.ts           # Session verification
│   └── role.ts           # Role check (admin, user, delivery)
└── routes/
    ├── auth.ts           # /api/auth/* (public)
    ├── products.ts       # /api/products/* (public)
    ├── subscriptions.ts  # /api/subscriptions/* (public)
    └── admin/
        ├── index.ts      # /api/admin/* (role guard)
        ├── users.ts      # admin only
        ├── products.ts   # admin only
        ├── orders.ts     # admin + delivery (role check inside)
        ├── subscriptions.ts  # admin only
        ├── schedules.ts  # admin only
        ├── provinces.ts  # admin only
        └── dashboard.ts  # admin only
```

**Role middleware pattern:**
```ts
// Apply to entire admin router
admin.use("*", roleGuard("admin", "delivery"));

// Or per-route for mixed access
orders.get("/", roleGuard("admin", "delivery"), handler);
users.get("/", roleGuard("admin"), handler);  // admin only
```
