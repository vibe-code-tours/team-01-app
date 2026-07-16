import { Hono } from "hono";
import { eq, desc, count, sql } from "drizzle-orm";
import { db, user, orders, orderItems, products, subscriptions, orderSchedules, schedules, townships, deliveryPersons } from "@water-delivery/db";
import { authMiddleware, requireRole } from "../middleware/auth.js";

const routes = new Hono();

routes.use("*", authMiddleware);

routes.get("/orders", requireRole("super-admin", "admin"), async (c) => {
  const page = Number(c.req.query("page") || "1");
  const limit = Number(c.req.query("limit") || "10");
  const status = c.req.query("status") || "";
  const type = c.req.query("type") || "";
  const search = c.req.query("search") || "";
  const offset = (page - 1) * limit;

  const conditions = [];
  if (status) {
    conditions.push(sql`${orders.status} = ${status}`);
  }
  if (type) {
    conditions.push(sql`${orders.orderType} = ${type}`);
  }
  if (search) {
    conditions.push(sql`(${user.name} ILIKE ${`%${search}%`} OR ${orders.id} ILIKE ${`%${search}%`})`);
  }

  const where = conditions.length > 0 ? sql.join(conditions, sql` AND `) : undefined;

  const [{ total }] = await db.select({ total: count() }).from(orders).leftJoin(user, eq(orders.userId, user.id)).where(where);

  const items = await db
    .select({
      id: orders.id,
      userId: orders.userId,
      orderType: orders.orderType,
      totalAmount: orders.totalAmount,
      bottleCount: orders.bottleCount,
      status: orders.status,
      createdAt: orders.createdAt,
      updatedAt: orders.updatedAt,
      userName: user.name,
      userEmail: user.email,
    })
    .from(orders)
    .leftJoin(user, eq(orders.userId, user.id))
    .where(where)
    .orderBy(desc(orders.createdAt))
    .limit(limit)
    .offset(offset);

  return c.json({
    success: true,
    data: {
      orders: items,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    },
  });
});

routes.get("/orders/:id", requireRole("super-admin", "admin"), async (c) => {
  const id = c.req.param("id") as string;

  const [order] = await db
    .select({
      id: orders.id,
      userId: orders.userId,
      orderType: orders.orderType,
      totalAmount: orders.totalAmount,
      bottleCount: orders.bottleCount,
      status: orders.status,
      paymentProofUrl: orders.paymentProofUrl,
      paymentDetails: orders.paymentDetails,
      adminNotes: orders.adminNotes,
      createdAt: orders.createdAt,
      updatedAt: orders.updatedAt,
      userName: user.name,
      userEmail: user.email,
      userPhone: user.phone,
    })
    .from(orders)
    .leftJoin(user, eq(orders.userId, user.id))
    .where(eq(orders.id, id));

  if (!order) {
    return c.json({ success: false, error: "Order not found" }, 404);
  }

  // For coupon-delivery orders, fetch schedule + delivery info
  if (order.orderType === "coupon-delivery") {
    const [scheduleInfo] = await db
      .select({
        scheduleId: orderSchedules.scheduleId,
        townshipId: orderSchedules.townshipId,
        deliveryAddress: orderSchedules.deliveryAddress,
        contactPhone: orderSchedules.contactPhone,
        notes: orderSchedules.notes,
        scheduleDate: schedules.date,
        scheduleTimeStart: schedules.timeStart,
        scheduleTimeEnd: schedules.timeEnd,
        townshipName: townships.name,
      })
      .from(orderSchedules)
      .leftJoin(schedules, eq(orderSchedules.scheduleId, schedules.id))
      .leftJoin(townships, eq(orderSchedules.townshipId, townships.id))
      .where(eq(orderSchedules.orderId, id));

    return c.json({ success: true, data: { ...order, scheduleInfo: scheduleInfo || null, items: [] } });
  }

  // For regular orders, fetch order items
  const items = await db
    .select({
      id: orderItems.id,
      productId: orderItems.productId,
      quantity: orderItems.quantity,
      unitPrice: orderItems.unitPrice,
      subtotal: orderItems.subtotal,
      productName: products.name,
    })
    .from(orderItems)
    .leftJoin(products, eq(orderItems.productId, products.id))
    .where(eq(orderItems.orderId, id));

  return c.json({ success: true, data: { ...order, items } });
});

routes.patch("/orders/:id", requireRole("super-admin", "admin"), async (c) => {
  const id = c.req.param("id") as string;
  const body = await c.req.json();
  const { status, adminNotes, deliveryPersonId } = body;

  const [existing] = await db.select().from(orders).where(eq(orders.id, id));
  if (!existing) {
    return c.json({ success: false, error: "Order not found" }, 404);
  }

  // Validate status transitions
  if (status && status !== existing.status) {
    const RETAIL_TRANSITIONS: Record<string, string[]> = {
      pending: ["paid", "cancelled"],
      paid: ["approved", "cancelled"],
      approved: ["cancelled"],       // user schedules, admin can only cancel
      scheduled: ["assigned", "cancelled"],
      assigned: ["delivered", "cancelled"],
      delivered: [],
      cancelled: [],
      rejected: [],
    };
    const COUPON_TRANSITIONS: Record<string, string[]> = {
      pending: ["paid", "cancelled"],
      paid: ["approved", "cancelled"],
      approved: ["cancelled"],       // user schedules
      scheduled: ["assigned", "cancelled"],
      assigned: ["delivered", "cancelled"],
      delivered: [],
      cancelled: [],
    };
    const SUBSCRIPTION_TRANSITIONS: Record<string, string[]> = {
      pending: ["paid", "cancelled"],
      paid: ["approved", "cancelled"],
      approved: [],
      cancelled: [],
      rejected: [],
    };
    const transitions = existing.orderType === "subscription" ? SUBSCRIPTION_TRANSITIONS
      : existing.orderType === "coupon-delivery" ? COUPON_TRANSITIONS
      : RETAIL_TRANSITIONS;
    const allowed = transitions[existing.status] || [];
    if (!allowed.includes(status)) {
      return c.json({ success: false, error: `Cannot change status from "${existing.status}" to "${status}"` }, 400);
    }
  }

  // Handle coupon-delivery specific status transitions
  if (existing.orderType === "coupon-delivery") {
    if (status === "assigned") {
      if (existing.status !== "scheduled") {
        return c.json({ success: false, error: "Can only assign scheduled deliveries" }, 400);
      }
      if (!deliveryPersonId) {
        return c.json({ success: false, error: "deliveryPersonId is required" }, 400);
      }
      const [dp] = await db
        .select()
        .from(deliveryPersons)
        .where(sql`${deliveryPersons.id} = ${deliveryPersonId} AND ${deliveryPersons.status} = 'active'`);
      if (!dp) {
        return c.json({ success: false, error: "Delivery person not found or inactive" }, 400);
      }
    } else if (status === "delivered") {
      if (existing.status !== "assigned") {
        return c.json({ success: false, error: "Can only deliver assigned deliveries" }, 400);
      }
    } else if (status === "cancelled") {
      if (existing.status === "delivered") {
        return c.json({ success: false, error: "Cannot cancel delivered deliveries" }, 400);
      }
      // Return coupons + decrement schedule
      const bottleCount = existing.bottleCount || 1;
      const activeSubs = await db
        .select()
        .from(subscriptions)
        .where(sql`${subscriptions.userId} = ${existing.userId} AND ${subscriptions.status} = 'active'`)
        .orderBy(sql`${subscriptions.expiresAt} DESC`);

      let remaining = bottleCount;
      for (const sub of activeSubs) {
        if (remaining <= 0) break;
        const returned = Math.min(remaining, sub.couponsRemaining);
        await db
          .update(subscriptions)
          .set({ couponsRemaining: sub.couponsRemaining + returned })
          .where(eq(subscriptions.id, sub.id));
        remaining -= returned;
      }

      const [orderSchedule] = await db
        .select()
        .from(orderSchedules)
        .where(eq(orderSchedules.orderId, id));
      if (orderSchedule) {
        const [schedule] = await db
          .select()
          .from(schedules)
          .where(eq(schedules.id, orderSchedule.scheduleId));
        if (schedule) {
          await db
            .update(schedules)
            .set({ currentOrders: Math.max(0, schedule.currentOrders - bottleCount) })
            .where(eq(schedules.id, orderSchedule.scheduleId));
        }
      }
    } else if (status) {
      return c.json({ success: false, error: "Invalid status" }, 400);
    }
  }

  const updates: Record<string, unknown> = {};
  if (status !== undefined) updates.status = status;
  if (adminNotes !== undefined) updates.adminNotes = adminNotes;

  if (Object.keys(updates).length === 0) {
    return c.json({ success: false, error: "No fields to update" }, 400);
  }

  updates.updatedAt = new Date();

  const [updated] = await db.update(orders).set(updates).where(eq(orders.id, id)).returning();

  // Emit status change notification immediately after DB update
  if (status && status !== existing.status) {
    try {
      const { createAndEmitNotification, broadcastToAdmins } = await import("../lib/notifications.js");
      const statusLabel = status.charAt(0).toUpperCase() + status.slice(1);
      await createAndEmitNotification({
        userId: existing.userId,
        type: "order_status_changed",
        title: `Order ${statusLabel}`,
        message: `Your order status has been updated to "${status}".`,
        entityType: "order",
        entityId: id,
        link: `/orders/${id}`,
      });
      broadcastToAdmins("order:status-changed", { orderId: id, status });
    } catch { /* best-effort */ }
  }

  // When subscription order is approved, create the subscription with coupons
  if (status === "approved" && existing.orderType === "subscription" && existing.status !== "approved") {
    try {
      const details = JSON.parse(existing.paymentDetails || "{}");
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + (details.expiresInDays || 30));

      await db.insert(subscriptions).values({
        userId: existing.userId,
        packageId: details.packageId,
        couponsRemaining: details.couponCount,
        expiresAt,
      });

      try {
        const { createAndEmitNotification } = await import("../lib/notifications.js");
        await createAndEmitNotification({
          userId: existing.userId,
          type: "subscription_approved",
          title: "Subscription Approved",
          message: `Your subscription order has been approved. You now have ${details.couponCount} delivery coupons.`,
          entityType: "subscription",
          entityId: id,
          link: `/subscriptions`,
        });
      } catch { /* best-effort */ }
    } catch (e) {
      console.error("Failed to create subscription on approval:", e);
    }
  }

  return c.json({ success: true, data: updated });
});

// List active delivery persons (for assign dropdown)
routes.get("/delivery-persons", requireRole("super-admin", "admin"), async (c) => {
  const items = await db
    .select({
      id: deliveryPersons.id,
      name: deliveryPersons.name,
      phone: deliveryPersons.phone,
    })
    .from(deliveryPersons)
    .where(sql`${deliveryPersons.status} = 'active'`)
    .orderBy(deliveryPersons.name);

  return c.json({ success: true, data: items });
});

// Bulk assign orders to a delivery person
routes.post("/assignments/bulk", requireRole("super-admin", "admin"), async (c) => {
  const body = await c.req.json();
  const { orderIds, deliveryPersonId } = body;

  if (!orderIds?.length || !deliveryPersonId) {
    return c.json({ success: false, error: "orderIds and deliveryPersonId are required" }, 400);
  }

  // Verify delivery person exists and is active
  const [dp] = await db
    .select()
    .from(deliveryPersons)
    .where(sql`${deliveryPersons.id} = ${deliveryPersonId} AND ${deliveryPersons.status} = 'active'`);
  if (!dp) {
    return c.json({ success: false, error: "Delivery person not found or inactive" }, 400);
  }

  // Update orders: set deliveryPersonId, assignedAt, status = "assigned"
  const now = new Date();
  let assignedCount = 0;

  for (const orderId of orderIds) {
    const [existing] = await db.select().from(orders).where(eq(orders.id, orderId));
    if (!existing) continue;
    // Only assign orders that are in assignable statuses
    if (!["approved", "scheduled"].includes(existing.status)) continue;

    await db
      .update(orders)
      .set({
        deliveryPersonId,
        assignedAt: now,
        status: "assigned",
        updatedAt: now,
      })
      .where(eq(orders.id, orderId));
    assignedCount++;

    // Notify user
    try {
      const { createAndEmitNotification } = await import("../lib/notifications.js");
      await createAndEmitNotification({
        userId: existing.userId,
        type: "delivery_created",
        title: "Delivery Assigned",
        message: `Your order has been assigned to ${dp.name} for delivery.`,
        entityType: "order",
        entityId: orderId,
        link: `/orders/${orderId}`,
      });
    } catch { /* best-effort */ }
  }

  // Broadcast to admins
  try {
    const { broadcastToAdmins } = await import("../lib/notifications.js");
    broadcastToAdmins("delivery:new", { count: assignedCount });
  } catch { /* best-effort */ }

  return c.json({ success: true, data: { assigned: assignedCount, deliveryPerson: dp.name } });
});

// Get assignable orders (approved/scheduled) for assignment panel
routes.get("/assignable", requireRole("super-admin", "admin"), async (c) => {
  const townshipId = c.req.query("townshipId") || "";
  const provinceId = c.req.query("provinceId") || "";

  const conditions = [
    sql`${orders.status} IN ('approved', 'scheduled')`,
    sql`${orders.orderType} != 'subscription'`,
  ];

  if (townshipId) {
    conditions.push(sql`${orderSchedules.townshipId} = ${townshipId}`);
  } else if (provinceId) {
    conditions.push(sql`${townships.provinceId} = ${provinceId}`);
  }

  const where = sql.join(conditions, sql` AND `);

  const items = await db
    .select({
      id: orders.id,
      userId: orders.userId,
      orderType: orders.orderType,
      totalAmount: orders.totalAmount,
      bottleCount: orders.bottleCount,
      status: orders.status,
      createdAt: orders.createdAt,
      userName: user.name,
      deliveryAddress: orderSchedules.deliveryAddress,
      contactPhone: orderSchedules.contactPhone,
      townshipName: townships.name,
      scheduleDate: schedules.date,
      scheduleTimeStart: schedules.timeStart,
      scheduleTimeEnd: schedules.timeEnd,
    })
    .from(orders)
    .leftJoin(user, eq(orders.userId, user.id))
    .leftJoin(orderSchedules, eq(orderSchedules.orderId, orders.id))
    .leftJoin(townships, eq(orderSchedules.townshipId, townships.id))
    .leftJoin(schedules, eq(orderSchedules.scheduleId, schedules.id))
    .where(where)
    .orderBy(orders.createdAt);

  return c.json({ success: true, data: items });
});

// Get orders assigned to a specific delivery person
routes.get("/assigned/:deliveryPersonId", requireRole("super-admin", "admin", "delivery"), async (c) => {
  const dpId = c.req.param("deliveryPersonId") as string;
  const status = c.req.query("status") || "";

  const conditions = [
    sql`${orders.deliveryPersonId} = ${dpId}`,
    sql`${orders.status} IN ('assigned', 'delivered')`,
  ];

  if (status) {
    conditions.push(sql`${orders.status} = ${status}`);
  }

  const where = sql.join(conditions, sql` AND `);

  const items = await db
    .select({
      id: orders.id,
      userId: orders.userId,
      orderType: orders.orderType,
      totalAmount: orders.totalAmount,
      bottleCount: orders.bottleCount,
      status: orders.status,
      createdAt: orders.createdAt,
      assignedAt: orders.assignedAt,
      userName: user.name,
      userPhone: user.phone,
      deliveryAddress: orderSchedules.deliveryAddress,
      contactPhone: orderSchedules.contactPhone,
      townshipName: townships.name,
      scheduleDate: schedules.date,
      scheduleTimeStart: schedules.timeStart,
      scheduleTimeEnd: schedules.timeEnd,
    })
    .from(orders)
    .leftJoin(user, eq(orders.userId, user.id))
    .leftJoin(orderSchedules, eq(orderSchedules.orderId, orders.id))
    .leftJoin(townships, eq(orderSchedules.townshipId, townships.id))
    .leftJoin(schedules, eq(orderSchedules.scheduleId, schedules.id))
    .where(where)
    .orderBy(orders.assignedAt);

  return c.json({ success: true, data: items });
});

// Mark order as delivered (by delivery person)
routes.patch("/orders/:id/deliver", requireRole("super-admin", "admin", "delivery"), async (c) => {
  const id = c.req.param("id") as string;
  const [existing] = await db.select().from(orders).where(eq(orders.id, id));
  if (!existing) {
    return c.json({ success: false, error: "Order not found" }, 404);
  }
  if (existing.status !== "assigned") {
    return c.json({ success: false, error: "Can only deliver assigned orders" }, 400);
  }

  const [updated] = await db
    .update(orders)
    .set({ status: "delivered", updatedAt: new Date() })
    .where(eq(orders.id, id))
    .returning();

  // Notify user
  try {
    const { createAndEmitNotification, broadcastToAdmins } = await import("../lib/notifications.js");
    await createAndEmitNotification({
      userId: existing.userId,
      type: "delivery_status_changed",
      title: "Order Delivered",
      message: "Your order has been delivered successfully.",
      entityType: "order",
      entityId: id,
      link: `/orders/${id}`,
    });
    broadcastToAdmins("order:status-changed", { orderId: id, status: "delivered" });
  } catch { /* best-effort */ }

  return c.json({ success: true, data: updated });
});

export { routes as orderRoutes };
