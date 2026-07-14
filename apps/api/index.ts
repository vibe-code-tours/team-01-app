import * as fs from "node:fs";
import * as path from "node:path";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import env from "./src/config/env.js";
import { healthRoutes } from "./src/routes/health.js";
import { adminRoutes } from "./src/routes/admin.js";
import { productRoutes } from "./src/routes/products.js";
import { orderRoutes } from "./src/routes/orders.js";
import { subscriptionRoutes } from "./src/routes/subscriptions.js";
import { provinceRoutes } from "./src/routes/provinces.js";
import { townshipRoutes } from "./src/routes/townships.js";
import { scheduleRoutes } from "./src/routes/schedules.js";
import { publicRoutes } from "./src/routes/public.js";
import { userRoutes } from "./src/routes/user.js";
import { userOrderRoutes } from "./src/routes/user-orders.js";
import { userCouponDeliveryRoutes } from "./src/routes/user-coupon-deliveries.js";
import { auth } from "./src/lib/auth.js";
import { errorHandler } from "./src/middleware/error.js";

const app = new Hono();

app.use("*", logger());
app.use("*", cors({ origin: env.API_CORS_ORIGIN, credentials: true }));

// better-auth catch-all handler
app.on(["POST", "GET"], "/api/auth/**", (c) => {
  return auth.handler(c.req.raw);
});

app.route("/health", healthRoutes);

// Serve uploaded files
const MIME_TYPES: Record<string, string> = {
  ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png",
  ".webp": "image/webp", ".gif": "image/gif",
};
app.get("/uploads/*", async (c) => {
  const filePath = path.join(process.cwd(), "apps/api", c.req.path);
  if (!fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) {
    return c.notFound();
  }
  const ext = path.extname(filePath).toLowerCase();
  c.header("Content-Type", MIME_TYPES[ext] || "application/octet-stream");
  c.header("Cache-Control", "public, max-age=86400");
  return c.body(fs.readFileSync(filePath));
});

// Serve uploads through /api prefix
app.get("/api/uploads/*", async (c) => {
  const reqPath = c.req.path.replace(/^\/api/, "");
  const filePath = path.join(process.cwd(), "apps/api", reqPath);
  if (!fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) {
    return c.notFound();
  }
  const ext = path.extname(filePath).toLowerCase();
  c.header("Content-Type", MIME_TYPES[ext] || "application/octet-stream");
  c.header("Cache-Control", "public, max-age=86400");
  return c.body(fs.readFileSync(filePath));
});

app.route("/api/admin", adminRoutes);
app.route("/api/admin", productRoutes);
app.route("/api/admin", orderRoutes);
app.route("/api/admin", subscriptionRoutes);
app.route("/api/admin", provinceRoutes);
app.route("/api/admin", townshipRoutes);
app.route("/api/admin", scheduleRoutes);

// Public routes (no auth)
app.route("/api", publicRoutes);

// User routes (auth required)
app.route("/api", userRoutes);
app.route("/api", userOrderRoutes);
app.route("/api", userCouponDeliveryRoutes);

app.onError(errorHandler);

// Vercel serverless handler
export default app;
