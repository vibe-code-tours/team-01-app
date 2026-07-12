import { Hono } from "hono";
import { eq, desc, count, sql } from "drizzle-orm";
import { db, products } from "@water-delivery/db";
import { authMiddleware, requireRole } from "../middleware/auth.js";

const routes = new Hono();

routes.use("*", authMiddleware);

routes.get("/products", requireRole("super-admin", "admin"), async (c) => {
  const page = Number(c.req.query("page") || "1");
  const limit = Number(c.req.query("limit") || "10");
  const search = c.req.query("search") || "";
  const type = c.req.query("type") || "";
  const status = c.req.query("status") || "";
  const offset = (page - 1) * limit;

  const conditions = [];
  if (search) {
    conditions.push(sql`(${products.name} ILIKE ${`%${search}%`} OR ${products.description} ILIKE ${`%${search}%`})`);
  }
  if (type) {
    conditions.push(eq(products.type, type));
  }
  if (status) {
    conditions.push(eq(products.status, status));
  }

  const where = conditions.length > 0 ? sql.join(conditions, sql` AND `) : undefined;

  const [{ total }] = await db.select({ total: count() }).from(products).where(where);
  const items = await db
    .select()
    .from(products)
    .where(where)
    .orderBy(desc(products.createdAt))
    .limit(limit)
    .offset(offset);

  return c.json({
    success: true,
    data: {
      products: items,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    },
  });
});

routes.get("/products/:id", requireRole("super-admin", "admin"), async (c) => {
  const id = c.req.param("id");
  const [found] = await db.select().from(products).where(eq(products.id, id));

  if (!found) {
    return c.json({ success: false, error: "Product not found" }, 404);
  }

  return c.json({ success: true, data: found });
});

routes.post("/products", requireRole("super-admin"), async (c) => {
  const body = await c.req.json();
  const { name, description, price, type, packSize, imageUrl, status } = body;

  if (!name || !price || !type) {
    return c.json({ success: false, error: "Name, price, and type are required" }, 400);
  }

  const [created] = await db
    .insert(products)
    .values({
      name,
      description: description || null,
      price: String(price),
      type,
      packSize: packSize || null,
      imageUrl: imageUrl || null,
      status: status || "active",
    })
    .returning();

  return c.json({ success: true, data: created }, 201);
});

routes.patch("/products/:id", requireRole("super-admin"), async (c) => {
  const id = c.req.param("id");
  const body = await c.req.json();

  const [existing] = await db.select().from(products).where(eq(products.id, id));
  if (!existing) {
    return c.json({ success: false, error: "Product not found" }, 404);
  }

  const updates: Record<string, unknown> = {};
  if (body.name !== undefined) updates.name = body.name;
  if (body.description !== undefined) updates.description = body.description;
  if (body.price !== undefined) updates.price = String(body.price);
  if (body.type !== undefined) updates.type = body.type;
  if (body.packSize !== undefined) updates.packSize = body.packSize;
  if (body.imageUrl !== undefined) updates.imageUrl = body.imageUrl;
  if (body.status !== undefined) updates.status = body.status;

  if (Object.keys(updates).length === 0) {
    return c.json({ success: false, error: "No fields to update" }, 400);
  }

  updates.updatedAt = new Date();

  const [updated] = await db.update(products).set(updates).where(eq(products.id, id)).returning();

  return c.json({ success: true, data: updated });
});

routes.delete("/products/:id", requireRole("super-admin"), async (c) => {
  const id = c.req.param("id");

  const [existing] = await db.select().from(products).where(eq(products.id, id));
  if (!existing) {
    return c.json({ success: false, error: "Product not found" }, 404);
  }

  if (existing.status === "inactive") {
    return c.json({ success: false, error: "Product is already inactive" }, 400);
  }

  await db.update(products).set({ status: "inactive", updatedAt: new Date() }).where(eq(products.id, id));

  return c.json({ success: true, data: { id, status: "inactive" } });
});

export { routes as productRoutes };
