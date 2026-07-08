import { Hono } from "hono";

export const healthRoutes = new Hono();

healthRoutes.get("/", (c) => {
  return c.json({
    success: true,
    data: { status: "ok", timestamp: new Date().toISOString() },
  });
});