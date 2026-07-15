import { Hono } from "hono";
import { eq, desc, count, sql, and } from "drizzle-orm";
import { db, notifications } from "@water-delivery/db";
import { authMiddleware } from "../middleware/auth.js";

const routes = new Hono();

routes.use("*", authMiddleware);

// List notifications for current user
routes.get("/user/notifications", async (c) => {
  const currentUser = c.get("user" as never) as { id: string };
  const page = Number(c.req.query("page") || "1");
  const limit = Number(c.req.query("limit") || "20");
  const offset = (page - 1) * limit;
  const unreadOnly = c.req.query("unread") === "true";

  const where = unreadOnly
    ? and(eq(notifications.userId, currentUser.id), eq(notifications.read, false))
    : eq(notifications.userId, currentUser.id);

  const [items, total, unread] = await Promise.all([
    db
      .select()
      .from(notifications)
      .where(where)
      .orderBy(desc(notifications.createdAt))
      .limit(limit)
      .offset(offset),
    db
      .select({ count: count() })
      .from(notifications)
      .where(eq(notifications.userId, currentUser.id)),
    db
      .select({ count: count() })
      .from(notifications)
      .where(
        and(
          eq(notifications.userId, currentUser.id),
          eq(notifications.read, false),
        ),
      ),
  ]);

  return c.json({
    success: true,
    data: {
      notifications: items,
      pagination: {
        page,
        limit,
        total: total[0].count,
        totalPages: Math.ceil(total[0].count / limit),
      },
      unreadCount: unread[0].count,
    },
  });
});

// Get unread count only
routes.get("/user/notifications/unread-count", async (c) => {
  const currentUser = c.get("user" as never) as { id: string };

  const [result] = await db
    .select({ count: count() })
    .from(notifications)
    .where(
      and(
        eq(notifications.userId, currentUser.id),
        eq(notifications.read, false),
      ),
    );

  return c.json({ success: true, data: { count: result.count } });
});

// Mark single notification as read
routes.patch("/user/notifications/:id/read", async (c) => {
  const currentUser = c.get("user" as never) as { id: string };
  const notificationId = c.req.param("id");

  await db
    .update(notifications)
    .set({ read: true })
    .where(
      and(
        eq(notifications.id, notificationId),
        eq(notifications.userId, currentUser.id),
      ),
    );

  return c.json({ success: true });
});

// Mark all notifications as read
routes.patch("/user/notifications/read-all", async (c) => {
  const currentUser = c.get("user" as never) as { id: string };

  await db
    .update(notifications)
    .set({ read: true })
    .where(
      and(
        eq(notifications.userId, currentUser.id),
        eq(notifications.read, false),
      ),
    );

  return c.json({ success: true });
});

export { routes as notificationRoutes };
