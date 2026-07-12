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

export { routes as subscriptionRoutes };
