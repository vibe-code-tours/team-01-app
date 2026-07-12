import { Hono } from "hono";
import { eq, desc, like, count, sql, sum } from "drizzle-orm";
import { db, user, account, orders, subscriptions } from "@water-delivery/db";
import { authMiddleware, requireRole } from "../middleware/auth.js";
import { hashPassword } from "../lib/password.js";

const routes = new Hono();

routes.use("*", authMiddleware);

routes.get("/stats", requireRole("super-admin", "admin"), async (c) => {
  const [userCount] = await db
    .select({ total: count() })
    .from(user)
    .where(sql`${user.status} != 'suspended'`);

  const [orderCount] = await db.select({ total: count() }).from(orders);

  const [revenue] = await db
    .select({ total: sum(orders.totalAmount) })
    .from(orders)
    .where(sql`${orders.status} IN ('paid', 'approved', 'scheduled', 'assigned', 'delivered')`);

  const [subCount] = await db
    .select({ total: count() })
    .from(subscriptions)
    .where(eq(subscriptions.status, "active"));

  const recentOrders = await db
    .select({
      id: orders.id,
      orderType: orders.orderType,
      totalAmount: orders.totalAmount,
      status: orders.status,
      createdAt: orders.createdAt,
      userName: user.name,
    })
    .from(orders)
    .leftJoin(user, eq(orders.userId, user.id))
    .orderBy(desc(orders.createdAt))
    .limit(5);

  return c.json({
    success: true,
    data: {
      totalUsers: userCount.total,
      totalOrders: orderCount.total,
      totalRevenue: revenue.total || "0",
      activeSubscriptions: subCount.total,
      recentOrders,
    },
  });
});

routes.get("/me", (c) => {
  const currentUser = c.get("user");
  return c.json({ success: true, data: currentUser });
});

routes.get("/users", requireRole("super-admin", "admin"), async (c) => {
  const page = Number(c.req.query("page") || "1");
  const limit = Number(c.req.query("limit") || "10");
  const search = c.req.query("search") || "";
  const role = c.req.query("role") || "";
  const offset = (page - 1) * limit;

  const conditions = [];
  if (search) {
    conditions.push(sql`(${user.name} ILIKE ${`%${search}%`} OR ${user.email} ILIKE ${`%${search}%`})`);
  }
  if (role) {
    conditions.push(eq(user.role, role));
  }

  const where = conditions.length > 0 ? sql.join(conditions, sql` AND `) : undefined;

  const [{ total }] = await db.select({ total: count() }).from(user).where(where);
  const users = await db
    .select({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status,
      phone: user.phone,
      createdAt: user.createdAt,
    })
    .from(user)
    .where(where)
    .orderBy(desc(user.createdAt))
    .limit(limit)
    .offset(offset);

  return c.json({
    success: true,
    data: {
      users,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    },
  });
});

routes.get("/users/:id", requireRole("super-admin", "admin"), async (c) => {
  const id = c.req.param("id");
  const [found] = await db
    .select({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status,
      phone: user.phone,
      address: user.address,
      provinceId: user.provinceId,
      townshipId: user.townshipId,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    })
    .from(user)
    .where(eq(user.id, id));

  if (!found) {
    return c.json({ success: false, error: "User not found" }, 404);
  }

  return c.json({ success: true, data: found });
});

routes.post("/users", requireRole("super-admin"), async (c) => {
  const body = await c.req.json();
  const { email, name, password, role, phone } = body;

  if (!email || !name || !password) {
    return c.json({ success: false, error: "Email, name, and password are required" }, 400);
  }

  const [existing] = await db.select().from(user).where(eq(user.email, email));
  if (existing) {
    return c.json({ success: false, error: "Email already exists" }, 409);
  }

  const userId = crypto.randomUUID();
  const passwordHash = await hashPassword(password);

  await db.insert(user).values({
    id: userId,
    email,
    name,
    role: role || "admin",
    status: "active",
    phone: phone || null,
    emailVerified: true,
  });

  await db.insert(account).values({
    id: crypto.randomUUID(),
    accountId: email,
    providerId: "credential",
    userId,
    password: passwordHash,
  });

  return c.json({ success: true, data: { id: userId, email, name, role: role || "admin" } }, 201);
});

routes.patch("/users/:id", requireRole("super-admin"), async (c) => {
  const id = c.req.param("id");
  const body = await c.req.json();
  const { name, role, status, phone } = body;

  const [existing] = await db.select().from(user).where(eq(user.id, id));
  if (!existing) {
    return c.json({ success: false, error: "User not found" }, 404);
  }

  const updates: Record<string, unknown> = {};
  if (name !== undefined) updates.name = name;
  if (role !== undefined) updates.role = role;
  if (status !== undefined) updates.status = status;
  if (phone !== undefined) updates.phone = phone;

  if (Object.keys(updates).length === 0) {
    return c.json({ success: false, error: "No fields to update" }, 400);
  }

  updates.updatedAt = new Date();

  await db.update(user).set(updates).where(eq(user.id, id));

  return c.json({ success: true, data: { id, ...updates } });
});

routes.delete("/users/:id", requireRole("super-admin"), async (c) => {
  const id = c.req.param("id");

  const [existing] = await db.select().from(user).where(eq(user.id, id));
  if (!existing) {
    return c.json({ success: false, error: "User not found" }, 404);
  }

  if (existing.role === "super-admin") {
    return c.json({ success: false, error: "Cannot suspend super-admin" }, 403);
  }

  await db.update(user).set({ status: "suspended", updatedAt: new Date() }).where(eq(user.id, id));

  return c.json({ success: true, data: { id, status: "suspended" } });
});

export { routes as adminRoutes };
