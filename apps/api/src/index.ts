import type { Server as HttpServer } from "node:http";
import * as fs from "node:fs";
import * as path from "node:path";
import { Hono } from "hono";
import { serve } from "@hono/node-server";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { Server as SocketIOServer } from "socket.io";
import env from "./config/env.js";
import { healthRoutes } from "./routes/health.js";
import { adminRoutes } from "./routes/admin.js";
import { productRoutes } from "./routes/products.js";
import { orderRoutes } from "./routes/orders.js";
import { subscriptionRoutes } from "./routes/subscriptions.js";
import { provinceRoutes } from "./routes/provinces.js";
import { townshipRoutes } from "./routes/townships.js";
import { scheduleRoutes } from "./routes/schedules.js";
import { publicRoutes } from "./routes/public.js";
import { userRoutes } from "./routes/user.js";
import { userOrderRoutes } from "./routes/user-orders.js";
import { userCouponDeliveryRoutes } from "./routes/user-coupon-deliveries.js";
import { notificationRoutes } from "./routes/notifications.js";
import { auth } from "./lib/auth.js";
import { errorHandler } from "./middleware/error.js";
import { setupSocketIO } from "./ws/index.js";
import { setIO } from "./lib/io.js";

const app = new Hono();

app.use("*", logger());
app.use("*", cors({ origin: env.API_CORS_ORIGIN, credentials: true }));

// better-auth handler — must run before route-level auth middleware
app.use("/api/auth/*", async (c) => {
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

// Serve uploads through /api prefix (via Next.js proxy)
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

// Serve uploads for payments through /api prefix
app.get("/api/uploads/payments/*", async (c) => {
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
app.route("/api", notificationRoutes);

app.onError(errorHandler);

const httpServer = serve({
  fetch: app.fetch,
  port: env.API_PORT,
});

const io = new SocketIOServer(httpServer as HttpServer, {
  cors: { origin: env.API_CORS_ORIGIN, credentials: true },
});

setupSocketIO(io);
setIO(io);

console.log(`API server running on port ${env.API_PORT}`);
console.log(`Socket.IO server ready`);

export { app, io };
