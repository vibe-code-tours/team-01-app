import { Hono } from "hono";
import { eq, desc, count, sql } from "drizzle-orm";
import { db, orders, orderSchedules, subscriptions, schedules, townships } from "@water-delivery/db";
import { authMiddleware } from "../middleware/auth.js";

const routes = new Hono();

routes.use("*", authMiddleware);

// List my coupon deliveries
routes.get("/user/coupon-deliveries", async (c) => {
  const currentUser = c.get("user" as never) as { id: string };
  const page = Number(c.req.query("page") || "1");
  const limit = Number(c.req.query("limit") || "10");
  const status = c.req.query("status") || "";
  const offset = (page - 1) * limit;

  const conditions = [sql`${orders.userId} = ${currentUser.id}`, sql`${orders.orderType} = 'coupon-delivery'`];
  if (status) {
    conditions.push(sql`${orders.status} = ${status}`);
  }

  const where = sql.join(conditions, sql` AND `);

  const [{ total }] = await db.select({ total: count() }).from(orders).where(where);

  const items = await db
    .select({
      id: orders.id,
      bottleCount: orders.bottleCount,
      status: orders.status,
      createdAt: orders.createdAt,
      scheduleDate: schedules.date,
      scheduleTimeStart: schedules.timeStart,
      scheduleTimeEnd: schedules.timeEnd,
    })
    .from(orders)
    .leftJoin(orderSchedules, eq(orders.id, orderSchedules.orderId))
    .leftJoin(schedules, eq(orderSchedules.scheduleId, schedules.id))
    .where(where)
    .orderBy(desc(orders.createdAt))
    .limit(limit)
    .offset(offset);

  return c.json({
    success: true,
    data: {
      deliveries: items,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    },
  });
});

// Get coupon delivery detail
routes.get("/user/coupon-deliveries/:id", async (c) => {
  const currentUser = c.get("user" as never) as { id: string };
  const id = c.req.param("id") as string;

  const [delivery] = await db
    .select({
      id: orders.id,
      bottleCount: orders.bottleCount,
      status: orders.status,
      createdAt: orders.createdAt,
      updatedAt: orders.updatedAt,
      deliveryAddress: orderSchedules.deliveryAddress,
      contactPhone: orderSchedules.contactPhone,
      notes: orderSchedules.notes,
      scheduleDate: schedules.date,
      scheduleTimeStart: schedules.timeStart,
      scheduleTimeEnd: schedules.timeEnd,
      townshipName: townships.name,
    })
    .from(orders)
    .leftJoin(orderSchedules, eq(orders.id, orderSchedules.orderId))
    .leftJoin(schedules, eq(orderSchedules.scheduleId, schedules.id))
    .leftJoin(townships, eq(orderSchedules.townshipId, townships.id))
    .where(sql`${orders.id} = ${id} AND ${orders.userId} = ${currentUser.id} AND ${orders.orderType} = 'coupon-delivery'`);

  if (!delivery) {
    return c.json({ success: false, error: "Delivery not found" }, 404);
  }

  return c.json({ success: true, data: delivery });
});

// Create coupon delivery (schedule + deduct coupons)
routes.post("/user/coupon-deliveries", async (c) => {
  const currentUser = c.get("user" as never) as { id: string };
  const body = await c.req.json();
  const { bottleCount, scheduleId, deliveryAddress, contactPhone, notes } = body;

  if (!bottleCount || bottleCount < 1) {
    return c.json({ success: false, error: "bottleCount must be at least 1" }, 400);
  }
  if (!scheduleId) {
    return c.json({ success: false, error: "scheduleId is required" }, 400);
  }
  if (!deliveryAddress || !contactPhone) {
    return c.json({ success: false, error: "deliveryAddress and contactPhone are required" }, 400);
  }

  // Get user's township
  const [profile] = await db
    .select({ townshipId: sql<string>`${sql`"user".township_id`}` })
    .from(sql`"user"`)
    .where(sql`${sql`"user".id`} = ${currentUser.id}`);

  if (!profile?.townshipId) {
    return c.json({ success: false, error: "Please complete your profile first" }, 400);
  }

  // Get active, non-expired subscriptions ordered by earliest expiry
  const activeSubs = await db
    .select()
    .from(subscriptions)
    .where(sql`${subscriptions.userId} = ${currentUser.id} AND ${subscriptions.status} = 'active' AND ${subscriptions.expiresAt} > NOW()`)
    .orderBy(subscriptions.expiresAt);

  const totalCoupons = activeSubs.reduce((sum, s) => sum + s.couponsRemaining, 0);
  if (totalCoupons < bottleCount) {
    return c.json(
      { success: false, error: `Not enough coupons. You have ${totalCoupons} remaining.` },
      400,
    );
  }

  // Validate schedule
  const [schedule] = await db
    .select()
    .from(schedules)
    .where(eq(schedules.id, scheduleId));

  if (!schedule) {
    return c.json({ success: false, error: "Schedule not found" }, 404);
  }
  if (schedule.currentOrders + bottleCount > schedule.maxOrders) {
    return c.json({ success: false, error: "Not enough spots in this time slot" }, 400);
  }

  // Transaction: deduct coupons + create order + create order schedule + increment schedule
  const result = await db.transaction(async (tx) => {
    // Deduct coupons FIFO (earliest expiry first)
    let remaining = bottleCount;
    for (const sub of activeSubs) {
      if (remaining <= 0) break;
      const deduct = Math.min(sub.couponsRemaining, remaining);
      await tx
        .update(subscriptions)
        .set({ couponsRemaining: sub.couponsRemaining - deduct })
        .where(sql`${subscriptions.id} = ${sub.id} AND ${subscriptions.couponsRemaining} >= ${deduct}`);
      remaining -= deduct;
    }

    // Create order (type = coupon-delivery)
    const [order] = await tx
      .insert(orders)
      .values({
        userId: currentUser.id,
        orderType: "coupon-delivery",
        totalAmount: "0",
        status: "pending",
        bottleCount,
      })
      .returning();

    // Create order schedule entry
    await tx
      .insert(orderSchedules)
      .values({
        orderId: order.id,
        scheduleId,
        townshipId: profile.townshipId,
        deliveryAddress,
        contactPhone,
        notes: notes || null,
      });

    // Increment schedule capacity
    await tx
      .update(schedules)
      .set({ currentOrders: schedule.currentOrders + bottleCount })
      .where(eq(schedules.id, scheduleId));

    return order;
  });

  try {
    const { createAndEmitNotification, broadcastToAdmins } = await import("../lib/notifications.js");
    await createAndEmitNotification({
      userId: currentUser.id,
      type: "delivery_created",
      title: "Delivery Scheduled",
      message: `Your delivery of ${bottleCount} bottle(s) has been scheduled.`,
      entityType: "delivery",
      entityId: result.id,
      link: `/coupon-deliveries/${result.id}`,
    });
    broadcastToAdmins("delivery:new", { orderId: result.id, bottleCount });
  } catch { /* best-effort */ }

  return c.json({ success: true, data: result }, 201);
});

// Cancel coupon delivery (return coupons)
routes.patch("/user/coupon-deliveries/:id", async (c) => {
  const currentUser = c.get("user" as never) as { id: string };
  const id = c.req.param("id") as string;
  const body = await c.req.json();

  if (body.status !== "cancelled") {
    return c.json({ success: false, error: "Invalid status" }, 400);
  }

  const [delivery] = await db
    .select()
    .from(orders)
    .where(sql`${orders.id} = ${id} AND ${orders.userId} = ${currentUser.id} AND ${orders.orderType} = 'coupon-delivery'`);

  if (!delivery) {
    return c.json({ success: false, error: "Delivery not found" }, 404);
  }
  if (delivery.status !== "pending") {
    return c.json(
      { success: false, error: "Can only cancel pending deliveries" },
      400,
    );
  }

  // Get order schedule for decrementing currentOrders
  const [orderSchedule] = await db
    .select()
    .from(orderSchedules)
    .where(eq(orderSchedules.orderId, id));

  const bottleCount = delivery.bottleCount || 1;

  await db.transaction(async (tx) => {
    // Return coupons to subscriptions (reverse FIFO — latest expiry first)
    let remaining = bottleCount;
    const activeSubs = await tx
      .select()
      .from(subscriptions)
      .where(sql`${subscriptions.userId} = ${currentUser.id} AND ${subscriptions.status} = 'active'`)
      .orderBy(sql`${subscriptions.expiresAt} DESC`);

    for (const sub of activeSubs) {
      if (remaining <= 0) break;
      const returned = Math.min(remaining, sub.couponsRemaining);
      await tx
        .update(subscriptions)
        .set({ couponsRemaining: sub.couponsRemaining + returned })
        .where(eq(subscriptions.id, sub.id));
      remaining -= returned;
    }

    // Decrement schedule currentOrders
    if (orderSchedule) {
      const [schedule] = await tx
        .select()
        .from(schedules)
        .where(eq(schedules.id, orderSchedule.scheduleId));
      if (schedule) {
        await tx
          .update(schedules)
          .set({ currentOrders: Math.max(0, schedule.currentOrders - bottleCount) })
          .where(eq(schedules.id, orderSchedule.scheduleId));
      }
    }

    // Update order status
    await tx
      .update(orders)
      .set({ status: "cancelled", updatedAt: new Date() })
      .where(eq(orders.id, id));
  });

  try {
    const { createAndEmitNotification, broadcastToAdmins } = await import("../lib/notifications.js");
    await createAndEmitNotification({
      userId: currentUser.id,
      type: "delivery_status_changed",
      title: "Delivery Cancelled",
      message: `Your delivery has been cancelled. Coupons have been returned.`,
      entityType: "delivery",
      entityId: id,
      link: `/coupon-deliveries/${id}`,
    });
    broadcastToAdmins("delivery:status-changed", { orderId: id, status: "cancelled" });
  } catch { /* best-effort */ }

  return c.json({ success: true, data: { id, status: "cancelled" } });
});

export { routes as userCouponDeliveryRoutes };
