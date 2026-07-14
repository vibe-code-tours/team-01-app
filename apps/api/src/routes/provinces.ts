import { Hono } from "hono";
import { eq, desc, count, sql } from "drizzle-orm";
import { db, provinces } from "@water-delivery/db";
import { authMiddleware, requireRole } from "../middleware/auth.js";

const routes = new Hono();

routes.use("*", authMiddleware);

routes.get("/provinces", requireRole("super-admin", "admin"), async (c) => {
  const page = Number(c.req.query("page") || "1");
  const limit = Number(c.req.query("limit") || "10");
  const search = c.req.query("search") || "";
  const status = c.req.query("status") || "";
  const offset = (page - 1) * limit;

  const conditions = [];
  if (search) {
    conditions.push(sql`${provinces.name} ILIKE ${`%${search}%`}`);
  }
  if (status === "active") {
    conditions.push(eq(provinces.isActive, true));
  } else if (status === "inactive") {
    conditions.push(eq(provinces.isActive, false));
  }

  const where = conditions.length > 0 ? sql.join(conditions, sql` AND `) : undefined;

  const [{ total }] = await db.select({ total: count() }).from(provinces).where(where);
  const items = await db
    .select()
    .from(provinces)
    .where(where)
    .orderBy(desc(provinces.createdAt))
    .limit(limit)
    .offset(offset);

  return c.json({
    success: true,
    data: {
      provinces: items,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    },
  });
});

routes.get("/provinces/:id", requireRole("super-admin", "admin"), async (c) => {
  const id = c.req.param("id") as string;
  const [found] = await db.select().from(provinces).where(eq(provinces.id, id));

  if (!found) {
    return c.json({ success: false, error: "Province not found" }, 404);
  }

  return c.json({ success: true, data: found });
});

routes.post("/provinces", requireRole("super-admin"), async (c) => {
  const body = await c.req.json();
  const { name } = body;

  if (!name) {
    return c.json({ success: false, error: "Name is required" }, 400);
  }

  const [created] = await db.insert(provinces).values({ name }).returning();

  return c.json({ success: true, data: created }, 201);
});

routes.patch("/provinces/:id", requireRole("super-admin"), async (c) => {
  const id = c.req.param("id") as string;
  const body = await c.req.json();

  const [existing] = await db.select().from(provinces).where(eq(provinces.id, id));
  if (!existing) {
    return c.json({ success: false, error: "Province not found" }, 404);
  }

  const updates: Record<string, unknown> = {};
  if (body.name !== undefined) updates.name = body.name;
  if (body.isActive !== undefined) updates.isActive = body.isActive;

  if (Object.keys(updates).length === 0) {
    return c.json({ success: false, error: "No fields to update" }, 400);
  }

  const [updated] = await db.update(provinces).set(updates).where(eq(provinces.id, id)).returning();

  return c.json({ success: true, data: updated });
});

routes.delete("/provinces/:id", requireRole("super-admin"), async (c) => {
  const id = c.req.param("id") as string;

  const [existing] = await db.select().from(provinces).where(eq(provinces.id, id));
  if (!existing) {
    return c.json({ success: false, error: "Province not found" }, 404);
  }

  if (!existing.isActive) {
    return c.json({ success: false, error: "Province is already inactive" }, 400);
  }

  await db.update(provinces).set({ isActive: false }).where(eq(provinces.id, id));

  return c.json({ success: true, data: { id, isActive: false } });
});

export { routes as provinceRoutes };
