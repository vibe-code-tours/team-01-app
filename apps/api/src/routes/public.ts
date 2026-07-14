import { Hono } from "hono";
import { eq, desc, count, sql } from "drizzle-orm";
import { db, products, subscriptionPackages, provinces, townships } from "@water-delivery/db";

const routes = new Hono();

// --- Public Products (no auth) ---

routes.get("/products", async (c) => {
  const page = Number(c.req.query("page") || "1");
  const limit = Number(c.req.query("limit") || "20");
  const search = c.req.query("search") || "";
  const type = c.req.query("type") || "";
  const offset = (page - 1) * limit;

  const conditions = [eq(products.status, "active")];
  if (search) {
    conditions.push(sql`(${products.name} ILIKE ${`%${search}%`} OR ${products.description} ILIKE ${`%${search}%`})`);
  }
  if (type) {
    conditions.push(eq(products.type, type as "retail" | "pump" | "bottle"));
  }

  const where = sql.join(conditions, sql` AND `);

  const [{ total }] = await db.select({ total: count() }).from(products).where(where);
  const items = await db
    .select({
      id: products.id,
      name: products.name,
      description: products.description,
      price: products.price,
      type: products.type,
      packSize: products.packSize,
      imageUrl: products.imageUrl,
    })
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

routes.get("/products/:id", async (c) => {
  const id = c.req.param("id") as string;
  const [found] = await db
    .select({
      id: products.id,
      name: products.name,
      description: products.description,
      price: products.price,
      type: products.type,
      packSize: products.packSize,
      imageUrl: products.imageUrl,
    })
    .from(products)
    .where(sql`${products.id} = ${id} AND ${products.status} = 'active'`);

  if (!found) {
    return c.json({ success: false, error: "Product not found" }, 404);
  }

  return c.json({ success: true, data: found });
});

// --- Public Subscription Packages (no auth) ---

routes.get("/subscription-packages", async (c) => {
  const items = await db
    .select()
    .from(subscriptionPackages)
    .where(eq(subscriptionPackages.status, "active"))
    .orderBy(subscriptionPackages.price);

  return c.json({ success: true, data: items });
});

routes.get("/subscription-packages/:id", async (c) => {
  const id = c.req.param("id") as string;
  const [found] = await db
    .select()
    .from(subscriptionPackages)
    .where(sql`${subscriptionPackages.id} = ${id} AND ${subscriptionPackages.status} = 'active'`);

  if (!found) {
    return c.json({ success: false, error: "Package not found" }, 404);
  }

  return c.json({ success: true, data: found });
});

// --- Public Provinces/Townships (no auth) ---

routes.get("/provinces/list", async (c) => {
  const items = await db
    .select({ id: provinces.id, name: provinces.name })
    .from(provinces)
    .where(eq(provinces.isActive, true))
    .orderBy(provinces.name);

  return c.json({ success: true, data: items });
});

routes.get("/townships-by-province/:provinceId", async (c) => {
  const provinceId = c.req.param("provinceId") as string;
  const items = await db
    .select({ id: townships.id, name: townships.name })
    .from(townships)
    .where(sql`${townships.provinceId} = ${provinceId} AND ${townships.isActive} = true`)
    .orderBy(townships.name);

  return c.json({ success: true, data: items });
});

export { routes as publicRoutes };
