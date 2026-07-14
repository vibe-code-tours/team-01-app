import { Hono } from "hono";
import { eq, desc, count, sql } from "drizzle-orm";
import { db, townships, provinces } from "@water-delivery/db";
import { authMiddleware, requireRole } from "../middleware/auth.js";

const routes = new Hono();

routes.use("*", authMiddleware);

routes.get("/townships", requireRole("super-admin", "admin"), async (c) => {
  const page = Number(c.req.query("page") || "1");
  const limit = Number(c.req.query("limit") || "10");
  const search = c.req.query("search") || "";
  const status = c.req.query("status") || "";
  const provinceId = c.req.query("provinceId") || "";
  const offset = (page - 1) * limit;

  const conditions = [];
  if (search) {
    conditions.push(sql`${townships.name} ILIKE ${`%${search}%`}`);
  }
  if (status === "active") {
    conditions.push(eq(townships.isActive, true));
  } else if (status === "inactive") {
    conditions.push(eq(townships.isActive, false));
  }
  if (provinceId) {
    conditions.push(eq(townships.provinceId, provinceId));
  }

  const where = conditions.length > 0 ? sql.join(conditions, sql` AND `) : undefined;

  const [{ total }] = await db.select({ total: count() }).from(townships).where(where);
  const items = await db
    .select({
      id: townships.id,
      name: townships.name,
      provinceId: townships.provinceId,
      isActive: townships.isActive,
      createdAt: townships.createdAt,
      provinceName: provinces.name,
    })
    .from(townships)
    .leftJoin(provinces, eq(townships.provinceId, provinces.id))
    .where(where)
    .orderBy(desc(townships.createdAt))
    .limit(limit)
    .offset(offset);

  return c.json({
    success: true,
    data: {
      townships: items,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    },
  });
});

routes.get("/townships/:id", requireRole("super-admin", "admin"), async (c) => {
  const id = c.req.param("id") as string;
  const [found] = await db
    .select({
      id: townships.id,
      name: townships.name,
      provinceId: townships.provinceId,
      isActive: townships.isActive,
      createdAt: townships.createdAt,
      provinceName: provinces.name,
    })
    .from(townships)
    .leftJoin(provinces, eq(townships.provinceId, provinces.id))
    .where(eq(townships.id, id));

  if (!found) {
    return c.json({ success: false, error: "Township not found" }, 404);
  }

  return c.json({ success: true, data: found });
});

routes.get("/townships-by-province/:provinceId", requireRole("super-admin", "admin"), async (c) => {
  const provinceId = c.req.param("provinceId") as string;
  const items = await db
    .select()
    .from(townships)
    .where(sql`${townships.provinceId} = ${provinceId} AND ${townships.isActive} = true`)
    .orderBy(townships.name);

  return c.json({ success: true, data: items });
});

routes.post("/townships", requireRole("super-admin"), async (c) => {
  const body = await c.req.json();
  const { name, provinceId } = body;

  if (!name || !provinceId) {
    return c.json({ success: false, error: "Name and provinceId are required" }, 400);
  }

  const [province] = await db.select().from(provinces).where(eq(provinces.id, provinceId));
  if (!province) {
    return c.json({ success: false, error: "Province not found" }, 400);
  }

  const [created] = await db.insert(townships).values({ name, provinceId }).returning();

  return c.json({ success: true, data: created }, 201);
});

routes.patch("/townships/:id", requireRole("super-admin"), async (c) => {
  const id = c.req.param("id") as string;
  const body = await c.req.json();

  const [existing] = await db.select().from(townships).where(eq(townships.id, id));
  if (!existing) {
    return c.json({ success: false, error: "Township not found" }, 404);
  }

  const updates: Record<string, unknown> = {};
  if (body.name !== undefined) updates.name = body.name;
  if (body.provinceId !== undefined) updates.provinceId = body.provinceId;
  if (body.isActive !== undefined) updates.isActive = body.isActive;

  if (Object.keys(updates).length === 0) {
    return c.json({ success: false, error: "No fields to update" }, 400);
  }

  const [updated] = await db.update(townships).set(updates).where(eq(townships.id, id)).returning();

  return c.json({ success: true, data: updated });
});

routes.delete("/townships/:id", requireRole("super-admin"), async (c) => {
  const id = c.req.param("id") as string;

  const [existing] = await db.select().from(townships).where(eq(townships.id, id));
  if (!existing) {
    return c.json({ success: false, error: "Township not found" }, 404);
  }

  if (!existing.isActive) {
    return c.json({ success: false, error: "Township is already inactive" }, 400);
  }

  await db.update(townships).set({ isActive: false }).where(eq(townships.id, id));

  return c.json({ success: true, data: { id, isActive: false } });
});

export { routes as townshipRoutes };
