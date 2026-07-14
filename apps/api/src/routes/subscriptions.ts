import { Hono } from "hono";
import { eq, desc, count, sql } from "drizzle-orm";
import { db, user, subscriptions, subscriptionPackages } from "@water-delivery/db";
import { authMiddleware, requireRole } from "../middleware/auth.js";

const routes = new Hono();

routes.use("*", authMiddleware);

routes.get("/subscriptions", requireRole("super-admin", "admin"), async (c) => {
  const page = Number(c.req.query("page") || "1");
  const limit = Number(c.req.query("limit") || "10");
  const status = c.req.query("status") || "";
  const search = c.req.query("search") || "";
  const offset = (page - 1) * limit;

  const conditions = [];
  if (status) {
    conditions.push(eq(subscriptions.status, status as "active" | "expired" | "cancelled"));
  }
  if (search) {
    conditions.push(sql`(${user.name} ILIKE ${`%${search}%`} OR ${user.email} ILIKE ${`%${search}%`})`);
  }

  const where = conditions.length > 0 ? sql.join(conditions, sql` AND `) : undefined;

  const [{ total }] = await db
    .select({ total: count() })
    .from(subscriptions)
    .leftJoin(user, eq(subscriptions.userId, user.id))
    .where(where);

  const items = await db
    .select({
      id: subscriptions.id,
      userId: subscriptions.userId,
      couponsRemaining: subscriptions.couponsRemaining,
      status: subscriptions.status,
      createdAt: subscriptions.createdAt,
      expiresAt: subscriptions.expiresAt,
      userName: user.name,
      userEmail: user.email,
      packageName: subscriptionPackages.name,
      packagePrice: subscriptionPackages.price,
      couponCount: subscriptionPackages.couponCount,
    })
    .from(subscriptions)
    .leftJoin(user, eq(subscriptions.userId, user.id))
    .leftJoin(subscriptionPackages, eq(subscriptions.packageId, subscriptionPackages.id))
    .where(where)
    .orderBy(desc(subscriptions.createdAt))
    .limit(limit)
    .offset(offset);

  return c.json({
    success: true,
    data: {
      subscriptions: items,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    },
  });
});

routes.get("/subscriptions/:id", requireRole("super-admin", "admin"), async (c) => {
  const id = c.req.param("id") as string;

  const [found] = await db
    .select({
      id: subscriptions.id,
      userId: subscriptions.userId,
      couponsRemaining: subscriptions.couponsRemaining,
      status: subscriptions.status,
      createdAt: subscriptions.createdAt,
      expiresAt: subscriptions.expiresAt,
      userName: user.name,
      userEmail: user.email,
      userPhone: user.phone,
      packageName: subscriptionPackages.name,
      packagePrice: subscriptionPackages.price,
      couponCount: subscriptionPackages.couponCount,
      packageDescription: subscriptionPackages.description,
    })
    .from(subscriptions)
    .leftJoin(user, eq(subscriptions.userId, user.id))
    .leftJoin(subscriptionPackages, eq(subscriptions.packageId, subscriptionPackages.id))
    .where(eq(subscriptions.id, id));

  if (!found) {
    return c.json({ success: false, error: "Subscription not found" }, 404);
  }

  return c.json({ success: true, data: found });
});

// --- Subscription Package CRUD ---

routes.get("/subscription-packages", requireRole("super-admin", "admin"), async (c) => {
  const page = Number(c.req.query("page") || "1");
  const limit = Number(c.req.query("limit") || "10");
  const search = c.req.query("search") || "";
  const status = c.req.query("status") || "";
  const offset = (page - 1) * limit;

  const conditions = [];
  if (search) {
    conditions.push(sql`(${subscriptionPackages.name} ILIKE ${`%${search}%`} OR ${subscriptionPackages.description} ILIKE ${`%${search}%`})`);
  }
  if (status) {
    conditions.push(eq(subscriptionPackages.status, status as "active" | "inactive"));
  }

  const where = conditions.length > 0 ? sql.join(conditions, sql` AND `) : undefined;

  const [{ total }] = await db.select({ total: count() }).from(subscriptionPackages).where(where);
  const items = await db
    .select()
    .from(subscriptionPackages)
    .where(where)
    .orderBy(desc(subscriptionPackages.createdAt))
    .limit(limit)
    .offset(offset);

  return c.json({
    success: true,
    data: {
      packages: items,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    },
  });
});

routes.get("/subscription-packages/:id", requireRole("super-admin", "admin"), async (c) => {
  const id = c.req.param("id") as string;
  const [found] = await db.select().from(subscriptionPackages).where(eq(subscriptionPackages.id, id));

  if (!found) {
    return c.json({ success: false, error: "Package not found" }, 404);
  }

  return c.json({ success: true, data: found });
});

routes.post("/subscription-packages", requireRole("super-admin"), async (c) => {
  const body = await c.req.json();
  const { name, couponCount, price, description, expiresInDays } = body;

  if (!name || couponCount === undefined || price === undefined) {
    return c.json({ success: false, error: "Name, couponCount, and price are required" }, 400);
  }

  const [created] = await db
    .insert(subscriptionPackages)
    .values({
      name,
      couponCount: Number(couponCount),
      price: String(price),
      description: description || null,
      expiresInDays: expiresInDays !== undefined ? Number(expiresInDays) : 30,
    })
    .returning();

  return c.json({ success: true, data: created }, 201);
});

routes.patch("/subscription-packages/:id", requireRole("super-admin"), async (c) => {
  const id = c.req.param("id") as string;
  const body = await c.req.json();

  const [existing] = await db.select().from(subscriptionPackages).where(eq(subscriptionPackages.id, id));
  if (!existing) {
    return c.json({ success: false, error: "Package not found" }, 404);
  }

  const updates: Record<string, unknown> = {};
  if (body.name !== undefined) updates.name = body.name;
  if (body.couponCount !== undefined) updates.couponCount = Number(body.couponCount);
  if (body.price !== undefined) updates.price = String(body.price);
  if (body.description !== undefined) updates.description = body.description;
  if (body.expiresInDays !== undefined) updates.expiresInDays = Number(body.expiresInDays);
  if (body.status !== undefined) updates.status = body.status;

  if (Object.keys(updates).length === 0) {
    return c.json({ success: false, error: "No fields to update" }, 400);
  }

  updates.updatedAt = new Date();

  const [updated] = await db.update(subscriptionPackages).set(updates).where(eq(subscriptionPackages.id, id)).returning();

  return c.json({ success: true, data: updated });
});

routes.delete("/subscription-packages/:id", requireRole("super-admin"), async (c) => {
  const id = c.req.param("id") as string;

  const [existing] = await db.select().from(subscriptionPackages).where(eq(subscriptionPackages.id, id));
  if (!existing) {
    return c.json({ success: false, error: "Package not found" }, 404);
  }

  if (existing.status === "inactive") {
    return c.json({ success: false, error: "Package is already inactive" }, 400);
  }

  await db.update(subscriptionPackages).set({ status: "inactive", updatedAt: new Date() }).where(eq(subscriptionPackages.id, id));

  return c.json({ success: true, data: { id, status: "inactive" } });
});

export { routes as subscriptionRoutes };
