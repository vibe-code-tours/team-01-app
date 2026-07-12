import { Hono } from "hono";
import { eq, desc, count, sql } from "drizzle-orm";
import { db, user, orders, orderItems, products } from "@water-delivery/db";
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
    conditions.push(eq(orders.status, status));
  }
  if (type) {
    conditions.push(eq(orders.orderType, type));
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
  const id = c.req.param("id");

  const [order] = await db
    .select({
      id: orders.id,
      userId: orders.userId,
      orderType: orders.orderType,
      totalAmount: orders.totalAmount,
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
  const id = c.req.param("id");
  const body = await c.req.json();
  const { status, adminNotes } = body;

  const [existing] = await db.select().from(orders).where(eq(orders.id, id));
  if (!existing) {
    return c.json({ success: false, error: "Order not found" }, 404);
  }

  const updates: Record<string, unknown> = {};
  if (status !== undefined) updates.status = status;
  if (adminNotes !== undefined) updates.adminNotes = adminNotes;

  if (Object.keys(updates).length === 0) {
    return c.json({ success: false, error: "No fields to update" }, 400);
  }

  updates.updatedAt = new Date();

  const [updated] = await db.update(orders).set(updates).where(eq(orders.id, id)).returning();

  return c.json({ success: true, data: updated });
});

export { routes as orderRoutes };
