import { Hono } from "hono";
import { eq, desc, count, sql } from "drizzle-orm";
import {
  db,
  orders,
  orderItems,
  products,
  orderSchedules,
  schedules,
} from "@water-delivery/db";
import { authMiddleware } from "../middleware/auth.js";
import Busboy from "busboy";
import * as fs from "node:fs";
import * as path from "node:path";
import * as crypto from "node:crypto";
import { Readable } from "node:stream";

const routes = new Hono();

routes.use("*", authMiddleware);

// Create order
routes.post("/user/orders", async (c) => {
  const currentUser = c.get("user" as never) as { id: string };
  const body = await c.req.json();
  const { items, paymentDetails } = body;

  if (!items || !Array.isArray(items) || items.length === 0) {
    return c.json({ success: false, error: "items array is required" }, 400);
  }

  // Validate products and calculate total
  let totalAmount = 0;
  const validatedItems: {
    product: typeof products.$inferSelect;
    quantity: number;
  }[] = [];

  for (const item of items) {
    const [product] = await db
      .select()
      .from(products)
      .where(
        sql`${products.id} = ${item.productId} AND ${products.status} = 'active'`,
      );

    if (!product) {
      return c.json(
        {
          success: false,
          error: `Product ${item.productId} not found or inactive`,
        },
        400,
      );
    }

    const qty = Number(item.quantity) || 1;
    totalAmount += Number(product.price) * qty;
    validatedItems.push({ product, quantity: qty });
  }

  const [order] = await db
    .insert(orders)
    .values({
      userId: currentUser.id,
      orderType: "retail",
      totalAmount: String(totalAmount),
      status: "pending",
      paymentDetails: paymentDetails || null,
    })
    .returning();

  for (const vi of validatedItems) {
    await db.insert(orderItems).values({
      orderId: order.id,
      productId: vi.product.id,
      quantity: String(vi.quantity),
      unitPrice: vi.product.price,
      subtotal: String(Number(vi.product.price) * vi.quantity),
    });
  }

  return c.json({ success: true, data: order }, 201);
});

// List my orders
routes.get("/user/orders", async (c) => {
  const currentUser = c.get("user" as never) as { id: string };
  const page = Number(c.req.query("page") || "1");
  const limit = Number(c.req.query("limit") || "10");
  const offset = (page - 1) * limit;

  const [{ total }] = await db
    .select({ total: count() })
    .from(orders)
    .where(eq(orders.userId, currentUser.id));

  const items = await db
    .select()
    .from(orders)
    .where(eq(orders.userId, currentUser.id))
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

// Get order detail
routes.get("/user/orders/:id", async (c) => {
  const currentUser = c.get("user" as never) as { id: string };
  const id = c.req.param("id") as string;

  const [order] = await db
    .select()
    .from(orders)
    .where(sql`${orders.id} = ${id} AND ${orders.userId} = ${currentUser.id}`);

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
      productImage: products.imageUrl,
    })
    .from(orderItems)
    .leftJoin(products, eq(orderItems.productId, products.id))
    .where(eq(orderItems.orderId, order.id));

  return c.json({ success: true, data: { ...order, items } });
});

// Upload payment proof
const UPLOAD_DIR = path.join(process.cwd(), "apps/api/uploads/payments");
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_SIZE = 5 * 1024 * 1024;

routes.post("/user/orders/:id/payment-proof", async (c) => {
  const currentUser = c.get("user" as never) as { id: string };
  const id = c.req.param("id") as string;

  const [order] = await db
    .select()
    .from(orders)
    .where(sql`${orders.id} = ${id} AND ${orders.userId} = ${currentUser.id}`);

  if (!order) return c.json({ success: false, error: "Order not found" }, 404);
  if (order.status !== "pending")
    return c.json(
      { success: false, error: "Can only upload proof for pending orders" },
      400,
    );

  const contentType = c.req.header("content-type") || "";
  if (!contentType.includes("multipart/form-data")) {
    return c.json(
      { success: false, error: "Expected multipart/form-data" },
      400,
    );
  }

  const buffer = Buffer.from(await c.req.arrayBuffer());
  let savedFilename = "";
  let fileBuffer: Buffer | null = null;
  let errorMsg = "";

  await new Promise<void>((resolve) => {
    const busboy = Busboy({
      headers: { "content-type": contentType },
      limits: { fileSize: MAX_SIZE, files: 1 },
    });
    busboy.on("file", (fieldname, stream, info) => {
      const ext = path.extname(info.filename || "").toLowerCase() || ".jpg";
      if (!ALLOWED_TYPES.includes(info.mimeType)) {
        stream.resume();
        errorMsg = "Invalid file type. Allowed: JPEG, PNG, WebP";
        resolve();
        return;
      }
      savedFilename = `${crypto.randomUUID()}${ext}`;
      const chunks: Buffer[] = [];
      stream.on("data", (chunk: Buffer) => chunks.push(chunk));
      stream.on("end", () => {
        fileBuffer = Buffer.concat(chunks);
      });
    });
    busboy.on("finish", () => resolve());
    busboy.on("error", () => {
      errorMsg = "Upload failed";
      resolve();
    });
    Readable.from(buffer).pipe(busboy);
  });

  if (errorMsg || !fileBuffer) {
    return c.json(
      { success: false, error: errorMsg || "No file uploaded" },
      400,
    );
  }

  // Ensure upload dir exists
  if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

  fs.writeFileSync(path.join(UPLOAD_DIR, savedFilename), fileBuffer);

  const proofUrl = `/uploads/payments/${savedFilename}`;
  await db
    .update(orders)
    .set({ paymentProofUrl: proofUrl, updatedAt: new Date() })
    .where(eq(orders.id, id));

  return c.json({ success: true, data: { paymentProofUrl: proofUrl } }, 201);
});

// Update order status (cancel or confirm payment)
routes.patch("/user/orders/:id", async (c) => {
  const currentUser = c.get("user" as never) as { id: string };
  const id = c.req.param("id") as string;
  const body = await c.req.json();

  const [order] = await db
    .select()
    .from(orders)
    .where(sql`${orders.id} = ${id} AND ${orders.userId} = ${currentUser.id}`);

  if (!order) return c.json({ success: false, error: "Order not found" }, 404);

  // Cancel pending order
  if (body.status === "cancelled") {
    if (order.status !== "pending")
      return c.json(
        { success: false, error: "Can only cancel pending orders" },
        400,
      );
    await db
      .update(orders)
      .set({ status: "cancelled", updatedAt: new Date() })
      .where(eq(orders.id, id));
    return c.json({ success: true, data: { id, status: "cancelled" } });
  }

  // Confirm payment (pending → paid)
  if (body.status === "paid") {
    if (order.status !== "pending")
      return c.json(
        { success: false, error: "Can only confirm pending orders" },
        400,
      );
    if (!order.paymentProofUrl)
      return c.json(
        { success: false, error: "Please upload payment proof first" },
        400,
      );
    await db
      .update(orders)
      .set({ status: "paid", updatedAt: new Date() })
      .where(eq(orders.id, id));
    return c.json({ success: true, data: { id, status: "paid" } });
  }

  return c.json({ success: false, error: "Invalid status" }, 400);
});

// Get available schedules for my township
routes.get("/user/schedules", async (c) => {
  const currentUser = c.get("user" as never) as { id: string };
  const date = c.req.query("date") || "";

  // Get user's township and province
  const [profile] = await db
    .select({
      provinceId: sql<string>`${sql`"user".province_id`}`,
      townshipId: sql<string>`${sql`"user".township_id`}`,
    })
    .from(sql`"user"`)
    .where(sql`${sql`"user".id`} = ${currentUser.id}`);

  if (!profile?.provinceId || !profile?.townshipId) {
    return c.json(
      { success: false, error: "Please complete your profile first" },
      400,
    );
  }

  // Find available schedules for user's township (use Myanmar timezone)
  const scheduleQuery = date
    ? sql`
        SELECT DISTINCT s.id, s.date, s.time_start, s.time_end, s.max_orders, s.current_orders,
               (s.max_orders - s.current_orders) as spots_left
        FROM schedules s
        LEFT JOIN schedule_townships st ON st.schedule_id = s.id
        WHERE s.province_id = ${profile.provinceId}::uuid
          AND (s.is_province_wide = true OR st.township_id = ${profile.townshipId}::uuid)
          AND s.current_orders < s.max_orders
          AND s.date = ${date}::date
        ORDER BY s.date, s.time_start
      `
    : sql`
        SELECT DISTINCT s.id, s.date, s.time_start, s.time_end, s.max_orders, s.current_orders,
               (s.max_orders - s.current_orders) as spots_left
        FROM schedules s
        LEFT JOIN schedule_townships st ON st.schedule_id = s.id
        WHERE s.province_id = ${profile.provinceId}::uuid
          AND (s.is_province_wide = true OR st.township_id = ${profile.townshipId}::uuid)
          AND s.current_orders < s.max_orders
          AND s.date >= (NOW() AT TIME ZONE 'Asia/Yangon')::date
        ORDER BY s.date, s.time_start
      `;

  const available = await db.execute(scheduleQuery);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rows: readonly Record<string, unknown>[] = Array.isArray(available) ? available : (available as { rows: Record<string, unknown>[] }).rows ?? [];
  return c.json({ success: true, data: rows });
});

// Book a schedule for an order
routes.post("/user/orders/:orderId/schedule", async (c) => {
  const currentUser = c.get("user" as never) as { id: string };
  const orderId = c.req.param("orderId") as string;
  const body = await c.req.json();
  const { scheduleId, deliveryAddress, contactPhone, notes } = body;

  if (!scheduleId)
    return c.json({ success: false, error: "scheduleId is required" }, 400);

  // Validate order
  const [order] = await db
    .select()
    .from(orders)
    .where(
      sql`${orders.id} = ${orderId} AND ${orders.userId} = ${currentUser.id}`,
    );

  if (!order) return c.json({ success: false, error: "Order not found" }, 404);
  if (order.status !== "pending" && order.status !== "approved") {
    return c.json(
      { success: false, error: "Order is not in a bookable status" },
      400,
    );
  }

  // Check if order already has a schedule
  const [existingSchedule] = await db
    .select()
    .from(orderSchedules)
    .where(eq(orderSchedules.orderId, orderId));

  if (existingSchedule) {
    return c.json(
      { success: false, error: "Order already has a scheduled delivery" },
      400,
    );
  }

  // Validate schedule has capacity
  const [schedule] = await db
    .select()
    .from(schedules)
    .where(eq(schedules.id, scheduleId));

  if (!schedule)
    return c.json({ success: false, error: "Schedule not found" }, 404);
  if (schedule.currentOrders >= schedule.maxOrders) {
    return c.json(
      { success: false, error: "This time slot is fully booked" },
      400,
    );
  }

  // Get user's township
  const [profile] = await db
    .select({ townshipId: sql<string>`${sql`"user".township_id`}` })
    .from(sql`"user"`)
    .where(sql`${sql`"user".id`} = ${currentUser.id}`);

  if (!profile?.townshipId) {
    return c.json(
      { success: false, error: "Please complete your profile first" },
      400,
    );
  }

  // Create order schedule
  await db.insert(orderSchedules).values({
    orderId,
    scheduleId,
    townshipId: profile.townshipId,
    deliveryAddress: deliveryAddress || "",
    contactPhone: contactPhone || "",
    notes: notes || null,
  });

  // Update schedule current_orders
  await db
    .update(schedules)
    .set({ currentOrders: schedule.currentOrders + 1 })
    .where(eq(schedules.id, scheduleId));

  // Update order status
  await db
    .update(orders)
    .set({ status: "scheduled", updatedAt: new Date() })
    .where(eq(orders.id, orderId));

  return c.json({ success: true, data: { orderId, scheduleId } }, 201);
});

export { routes as userOrderRoutes };
