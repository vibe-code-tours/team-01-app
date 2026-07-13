import type { Server as HttpServer } from "node:http";
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
import { auth } from "./lib/auth.js";
import { errorHandler } from "./middleware/error.js";
import { setupSocketIO } from "./ws/index.js";

const app = new Hono();

app.use("*", logger());
app.use("*", cors({ origin: env.API_CORS_ORIGIN, credentials: true }));

// better-auth catch-all handler
app.on(["POST", "GET"], "/api/auth/**", (c) => {
  return auth.handler(c.req.raw);
});

app.route("/health", healthRoutes);
app.route("/api/admin", adminRoutes);
app.route("/api/admin", productRoutes);
app.route("/api/admin", orderRoutes);
app.route("/api/admin", subscriptionRoutes);

app.onError(errorHandler);

const httpServer = serve({
  fetch: app.fetch,
  port: env.API_PORT,
});

const io = new SocketIOServer(httpServer as HttpServer, {
  cors: { origin: env.API_CORS_ORIGIN, credentials: true },
});

setupSocketIO(io);

console.log(`API server running on port ${env.API_PORT}`);
console.log(`Socket.IO server ready`);

export { app, io };
