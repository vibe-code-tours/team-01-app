import { Hono } from "hono";
import { eq, desc, count, sql, inArray } from "drizzle-orm";
import { db, schedules, scheduleTownships, townships, provinces } from "@water-delivery/db";
import { authMiddleware, requireRole } from "../middleware/auth.js";

const routes = new Hono();

routes.use("*", authMiddleware);

routes.get("/schedules", requireRole("super-admin", "admin"), async (c) => {
  const page = Number(c.req.query("page") || "1");
  const limit = Number(c.req.query("limit") || "10");
  const provinceId = c.req.query("provinceId") || "";
  const date = c.req.query("date") || "";
  const townshipId = c.req.query("townshipId") || "";
  const offset = (page - 1) * limit;

  const conditions = [];
  if (provinceId) {
    conditions.push(sql`${schedules.provinceId} = ${provinceId}`);
  }
  if (date) {
    conditions.push(sql`${schedules.date} = ${date}`);
  }
  if (townshipId) {
    conditions.push(sql`(${schedules.isProvinceWide} = true AND ${schedules.provinceId} = (SELECT ${townships.provinceId} FROM ${townships} WHERE ${townships.id} = ${townshipId})) OR EXISTS (SELECT 1 FROM ${scheduleTownships} WHERE ${scheduleTownships.scheduleId} = ${schedules.id} AND ${scheduleTownships.townshipId} = ${townshipId})`);
  }

  const where = conditions.length > 0 ? sql.join(conditions, sql` AND `) : undefined;

  const [{ total }] = await db.select({ total: count() }).from(schedules).where(where);
  const items = await db
    .select({
      id: schedules.id,
      provinceId: schedules.provinceId,
      date: schedules.date,
      timeStart: schedules.timeStart,
      timeEnd: schedules.timeEnd,
      maxOrders: schedules.maxOrders,
      currentOrders: schedules.currentOrders,
      isProvinceWide: schedules.isProvinceWide,
      createdAt: schedules.createdAt,
      provinceName: provinces.name,
    })
    .from(schedules)
    .leftJoin(provinces, eq(schedules.provinceId, provinces.id))
    .where(where)
    .orderBy(desc(schedules.date), desc(schedules.createdAt))
    .limit(limit)
    .offset(offset);

  // Attach township names to each schedule
  const scheduleIds = items.map((s) => s.id);
  let townshipMap: Record<string, string[]> = {};
  if (scheduleIds.length > 0) {
    const linked = await db
      .select({ scheduleId: scheduleTownships.scheduleId, name: townships.name })
      .from(scheduleTownships)
      .innerJoin(townships, eq(scheduleTownships.townshipId, townships.id))
      .where(inArray(scheduleTownships.scheduleId, scheduleIds));
    for (const row of linked) {
      if (!townshipMap[row.scheduleId]) townshipMap[row.scheduleId] = [];
      townshipMap[row.scheduleId].push(row.name);
    }
  }

  const schedulesWithTownships = items.map((s) => ({
    ...s,
    townshipNames: s.isProvinceWide ? ["All"] : (townshipMap[s.id] || []),
  }));

  return c.json({
    success: true,
    data: {
      schedules: schedulesWithTownships,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    },
  });
});

routes.get("/schedules/:id", requireRole("super-admin", "admin"), async (c) => {
  const id = c.req.param("id") as string;
  const [found] = await db
    .select({
      id: schedules.id,
      provinceId: schedules.provinceId,
      date: schedules.date,
      timeStart: schedules.timeStart,
      timeEnd: schedules.timeEnd,
      maxOrders: schedules.maxOrders,
      currentOrders: schedules.currentOrders,
      isProvinceWide: schedules.isProvinceWide,
      createdAt: schedules.createdAt,
      provinceName: provinces.name,
    })
    .from(schedules)
    .leftJoin(provinces, eq(schedules.provinceId, provinces.id))
    .where(eq(schedules.id, id));

  if (!found) {
    return c.json({ success: false, error: "Schedule not found" }, 404);
  }

  const linkedTownships = await db
    .select({
      id: townships.id,
      name: townships.name,
    })
    .from(scheduleTownships)
    .innerJoin(townships, eq(scheduleTownships.townshipId, townships.id))
    .where(eq(scheduleTownships.scheduleId, id));

  return c.json({ success: true, data: { ...found, townships: linkedTownships } });
});

routes.post("/schedules", requireRole("super-admin"), async (c) => {
  const body = await c.req.json();
  const { provinceId, date, dates, timeStart, timeEnd, maxOrders, isProvinceWide = true, townshipIds } = body;

  const allDates: string[] = dates && Array.isArray(dates) && dates.length > 0 ? dates : date ? [date] : [];
  if (!provinceId || allDates.length === 0 || !timeStart || !timeEnd || !maxOrders) {
    return c.json({ success: false, error: "provinceId, date(s), timeStart, timeEnd, and maxOrders are required" }, 400);
  }

  const [province] = await db.select().from(provinces).where(sql`${provinces.id} = ${provinceId} AND ${provinces.isActive} = true`);
  if (!province) {
    return c.json({ success: false, error: "Province not found or inactive" }, 400);
  }

  if (!isProvinceWide && (!townshipIds || !Array.isArray(townshipIds) || townshipIds.length === 0)) {
    return c.json({ success: false, error: "townshipIds is required when not province-wide" }, 400);
  }

  const results: typeof schedules.$inferSelect[] = [];

  for (const d of allDates) {
    const created = await db.transaction(async (tx) => {
      const [sched] = await tx
        .insert(schedules)
        .values({ provinceId, date: d, timeStart, timeEnd, maxOrders, isProvinceWide })
        .returning();

      if (isProvinceWide) {
        const activeTownships = await tx
          .select({ id: townships.id })
          .from(townships)
          .where(sql`${townships.provinceId} = ${provinceId} AND ${townships.isActive} = true`);

        if (activeTownships.length > 0) {
          await tx.insert(scheduleTownships).values(
            activeTownships.map((t) => ({ scheduleId: sched.id, townshipId: t.id }))
          );
        }
      } else {
        const validTownships = await tx
          .select({ id: townships.id })
          .from(townships)
          .where(sql`${townships.provinceId} = ${provinceId} AND ${townships.isActive} = true AND ${townships.id} IN ${sql`${townshipIds}`}`);

        if (validTownships.length > 0) {
          await tx.insert(scheduleTownships).values(
            validTownships.map((t) => ({ scheduleId: sched.id, townshipId: t.id }))
          );
        }
      }

      return sched;
    });

    results.push(created);
  }

  return c.json({ success: true, data: results }, 201);
});

routes.patch("/schedules/:id", requireRole("super-admin"), async (c) => {
  const id = c.req.param("id") as string;
  const body = await c.req.json();

  const [existing] = await db.select().from(schedules).where(eq(schedules.id, id));
  if (!existing) {
    return c.json({ success: false, error: "Schedule not found" }, 404);
  }

  const updates: Record<string, unknown> = {};
  if (body.date !== undefined) updates.date = body.date;
  if (body.timeStart !== undefined) updates.timeStart = body.timeStart;
  if (body.timeEnd !== undefined) updates.timeEnd = body.timeEnd;
  if (body.maxOrders !== undefined) updates.maxOrders = body.maxOrders;
  if (body.isProvinceWide !== undefined) updates.isProvinceWide = body.isProvinceWide;

  const needsRelink = body.isProvinceWide !== undefined || body.townshipIds !== undefined;

  if (Object.keys(updates).length === 0 && !needsRelink) {
    return c.json({ success: false, error: "No fields to update" }, 400);
  }

  const result = await db.transaction(async (tx) => {
    if (Object.keys(updates).length > 0) {
      await tx.update(schedules).set(updates).where(eq(schedules.id, id));
    }

    if (needsRelink) {
      await tx.delete(scheduleTownships).where(eq(scheduleTownships.scheduleId, id));

      const provinceWide = body.isProvinceWide !== undefined ? body.isProvinceWide : existing.isProvinceWide;

      if (provinceWide) {
        const activeTownships = await tx
          .select({ id: townships.id })
          .from(townships)
          .where(sql`${townships.provinceId} = ${existing.provinceId} AND ${townships.isActive} = true`);

        if (activeTownships.length > 0) {
          await tx.insert(scheduleTownships).values(
            activeTownships.map((t) => ({ scheduleId: id, townshipId: t.id }))
          );
        }
      } else {
        const townshipIds = body.townshipIds || [];
        if (Array.isArray(townshipIds) && townshipIds.length > 0) {
          const validTownships = await tx
            .select({ id: townships.id })
            .from(townships)
            .where(sql`${townships.provinceId} = ${existing.provinceId} AND ${townships.isActive} = true AND ${townships.id} IN ${sql`${townshipIds}`}`);

          if (validTownships.length > 0) {
            await tx.insert(scheduleTownships).values(
              validTownships.map((t) => ({ scheduleId: id, townshipId: t.id }))
            );
          }
        }
      }
    }

    const [updated] = await tx.select().from(schedules).where(eq(schedules.id, id));
    return updated;
  });

  return c.json({ success: true, data: result });
});

routes.delete("/schedules/:id", requireRole("super-admin"), async (c) => {
  const id = c.req.param("id") as string;

  const [existing] = await db.select().from(schedules).where(eq(schedules.id, id));
  if (!existing) {
    return c.json({ success: false, error: "Schedule not found" }, 404);
  }

  if (existing.currentOrders > 0) {
    return c.json({ success: false, error: "Cannot delete schedule with existing orders" }, 400);
  }

  await db.transaction(async (tx) => {
    await tx.delete(scheduleTownships).where(eq(scheduleTownships.scheduleId, id));
    await tx.delete(schedules).where(eq(schedules.id, id));
  });

  return c.json({ success: true, data: { id } });
});

export { routes as scheduleRoutes };
