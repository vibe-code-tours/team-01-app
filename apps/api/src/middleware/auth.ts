import type { Context, Next } from "hono";
import { auth } from "../lib/auth.js";

export const authMiddleware = async (c: Context, next: Next) => {
  const session = await auth.api.getSession({ headers: c.req.raw.headers });
  if (!session) {
    return c.json({ success: false, error: "Unauthorized" }, 401);
  }
  c.set("user", session.user);
  c.set("session", session.session);
  await next();
};

export const requireRole = (...roles: string[]) => {
  return async (c: Context, next: Next) => {
    const user = c.get("user") as { role?: string } | undefined;
    if (!user || !roles.includes(user.role || "")) {
      return c.json({ success: false, error: "Forbidden" }, 403);
    }
    await next();
  };
};
