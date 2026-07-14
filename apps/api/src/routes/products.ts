import { Hono } from "hono";
import { eq, desc, count, sql } from "drizzle-orm";
import { db, products } from "@water-delivery/db";
import { authMiddleware, requireRole } from "../middleware/auth.js";
import Busboy from "busboy";
import * as fs from "node:fs";
import * as path from "node:path";
import * as crypto from "node:crypto";
import { Readable } from "node:stream";
import sharp from "sharp";

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
    conditions.push(eq(products.type, type as "retail" | "pump" | "bottle"));
  }
  if (status) {
    conditions.push(eq(products.status, status as "active" | "inactive"));
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
  const id = c.req.param("id") as string;
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
  const id = c.req.param("id") as string;
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

const UPLOAD_DIR = path.join(process.cwd(), "apps/api/uploads/products");
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const MAX_SIZE = 5 * 1024 * 1024;

routes.post("/products/:id/image", requireRole("super-admin"), async (c) => {
  const id = c.req.param("id") as string;

  const [existing] = await db.select().from(products).where(eq(products.id, id));
  if (!existing) {
    return c.json({ success: false, error: "Product not found" }, 404);
  }

  const contentType = c.req.header("content-type") || "";
  if (!contentType.includes("multipart/form-data")) {
    return c.json({ success: false, error: "Expected multipart/form-data" }, 400);
  }

  // Collect full body buffer first, then process with busboy
  const buffer = Buffer.from(await c.req.arrayBuffer());

  let savedFilename = "";
  let fileBuffer: Buffer | null = null;
  let errorMsg = "";

  await new Promise<void>((resolve) => {
    const busboy = Busboy({ headers: { "content-type": contentType }, limits: { fileSize: MAX_SIZE, files: 1 } });

    busboy.on("file", (fieldname, stream, info) => {
      const ext = path.extname(info.filename || "").toLowerCase() || ".jpg";
      const mime = info.mimeType;

      if (!ALLOWED_TYPES.includes(mime)) {
        stream.resume();
        errorMsg = "Invalid file type. Allowed: JPEG, PNG, WebP, GIF";
        resolve();
        return;
      }

      savedFilename = `${crypto.randomUUID()}${ext}`;
      const chunks: Buffer[] = [];

      stream.on("data", (chunk: Buffer) => chunks.push(chunk));
      stream.on("limit", () => {
        errorMsg = "File too large. Max 5MB";
        resolve();
      });
      stream.on("end", () => {
        fileBuffer = Buffer.concat(chunks);
      });
    });

    busboy.on("finish", () => resolve());
    busboy.on("error", () => { errorMsg = "Upload failed"; resolve(); });

    Readable.from(buffer).pipe(busboy);
  });

  if (errorMsg || !fileBuffer) {
    return c.json({ success: false, error: errorMsg || "No file uploaded" }, 400);
  }

  if (existing.imageUrl && existing.imageUrl.startsWith("/uploads/")) {
    const oldPath = path.join(process.cwd(), "apps/api", existing.imageUrl);
    const thumbPath = oldPath.replace(/(\.\w+)$/, "_thumb$1");
    if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
    if (fs.existsSync(thumbPath)) fs.unlinkSync(thumbPath);
  }

  // Resize image to max 800px width and create 200px thumbnail
  const ext = path.extname(savedFilename);
  const baseName = savedFilename.replace(ext, "");
  const resizedPath = path.join(UPLOAD_DIR, savedFilename);
  const thumbPath = path.join(UPLOAD_DIR, `${baseName}_thumb${ext}`);

  await sharp(fileBuffer).resize({ width: 800, withoutEnlargement: true }).toFile(resizedPath);
  await sharp(fileBuffer).resize({ width: 200, withoutEnlargement: true }).toFile(thumbPath);

  const imageUrl = `/uploads/products/${savedFilename}`;
  await db.update(products).set({ imageUrl, updatedAt: new Date() }).where(eq(products.id, id));

  return c.json({ success: true, data: { imageUrl } }, 201);
});

routes.delete("/products/:id", requireRole("super-admin"), async (c) => {
  const id = c.req.param("id") as string;

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
