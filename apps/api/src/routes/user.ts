import { Hono } from "hono";
import { eq, desc, sql } from "drizzle-orm";
import { db, subscriptions, subscriptionPackages, user, provinces, townships, orders } from "@water-delivery/db";
import { authMiddleware } from "../middleware/auth.js";

const routes = new Hono();

routes.use("*", authMiddleware);

// Get my profile
routes.get("/user/profile", async (c) => {
  const currentUser = c.get("user" as never) as { id: string };

  const [profile] = await db
    .select({
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      address: user.address,
      provinceId: user.provinceId,
      townshipId: user.townshipId,
      provinceName: provinces.name,
      townshipName: townships.name,
    })
    .from(user)
    .leftJoin(provinces, sql`${user.provinceId} = ${provinces.id}::text`)
    .leftJoin(townships, sql`${user.townshipId} = ${townships.id}::text`)
    .where(eq(user.id, currentUser.id));

  if (!profile) {
    return c.json({ success: false, error: "User not found" }, 404);
  }

  return c.json({ success: true, data: profile });
});

// Update my profile
routes.patch("/user/profile", async (c) => {
  const currentUser = c.get("user" as never) as { id: string };
  const body = await c.req.json();
  const { phone, address, provinceId, townshipId } = body;

  const updates: Record<string, unknown> = {};
  if (phone !== undefined) updates.phone = phone;
  if (address !== undefined) updates.address = address;
  if (provinceId !== undefined) updates.provinceId = provinceId;
  if (townshipId !== undefined) updates.townshipId = townshipId;

  if (Object.keys(updates).length === 0) {
    return c.json({ success: false, error: "No fields to update" }, 400);
  }

  updates.updatedAt = new Date();

  await db.update(user).set(updates).where(eq(user.id, currentUser.id));

  return c.json({ success: true, data: { updated: true } });
});

// List my subscriptions
routes.get("/user/subscriptions", async (c) => {
  const currentUser = c.get("user" as never) as { id: string };

  const items = await db
    .select({
      id: subscriptions.id,
      status: subscriptions.status,
      couponsRemaining: subscriptions.couponsRemaining,
      createdAt: subscriptions.createdAt,
      expiresAt: subscriptions.expiresAt,
      packageName: subscriptionPackages.name,
      packagePrice: subscriptionPackages.price,
      couponCount: subscriptionPackages.couponCount,
    })
    .from(subscriptions)
    .leftJoin(subscriptionPackages, eq(subscriptions.packageId, subscriptionPackages.id))
    .where(eq(subscriptions.userId, currentUser.id))
    .orderBy(desc(subscriptions.createdAt));

  return c.json({ success: true, data: items });
});

// Get my subscription detail
routes.get("/user/subscriptions/:id", async (c) => {
  const currentUser = c.get("user" as never) as { id: string };
  const id = c.req.param("id") as string;

  const [found] = await db
    .select({
      id: subscriptions.id,
      status: subscriptions.status,
      couponsRemaining: subscriptions.couponsRemaining,
      createdAt: subscriptions.createdAt,
      expiresAt: subscriptions.expiresAt,
      packageName: subscriptionPackages.name,
      packagePrice: subscriptionPackages.price,
      couponCount: subscriptionPackages.couponCount,
      packageDescription: subscriptionPackages.description,
    })
    .from(subscriptions)
    .leftJoin(subscriptionPackages, eq(subscriptions.packageId, subscriptionPackages.id))
    .where(sql`${subscriptions.id} = ${id} AND ${subscriptions.userId} = ${currentUser.id}`);

  if (!found) {
    return c.json({ success: false, error: "Subscription not found" }, 404);
  }

  return c.json({ success: true, data: found });
});

// Purchase subscription package (creates order, not subscription directly)
routes.post("/user/subscriptions/purchase", async (c) => {
  const currentUser = c.get("user" as never) as { id: string };
  const body = await c.req.json();
  const { packageId } = body;

  if (!packageId) {
    return c.json({ success: false, error: "packageId is required" }, 400);
  }

  // Verify package exists and is active
  const [pkg] = await db
    .select()
    .from(subscriptionPackages)
    .where(sql`${subscriptionPackages.id} = ${packageId} AND ${subscriptionPackages.status} = 'active'`);

  if (!pkg) {
    return c.json({ success: false, error: "Package not found or inactive" }, 400);
  }

  // Create subscription order (pending payment)
  const [order] = await db
    .insert(orders)
    .values({
      userId: currentUser.id,
      orderType: "subscription",
      totalAmount: pkg.price,
      status: "pending",
      paymentDetails: JSON.stringify({ packageId, packageName: pkg.name, couponCount: pkg.couponCount, expiresInDays: pkg.expiresInDays || 30 }),
    })
    .returning();

  return c.json({ success: true, data: { orderId: order.id, status: order.status } }, 201);
});

export { routes as userRoutes };
