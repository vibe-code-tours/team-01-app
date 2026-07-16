import { db } from "@water-delivery/db";
import { notifications } from "@water-delivery/db/schema";
import { getIO } from "./io.js";

export interface NotifyParams {
  userId: string;
  type:
    | "order_created"
    | "order_status_changed"
    | "delivery_created"
    | "delivery_status_changed"
    | "subscription_purchased"
    | "subscription_approved";
  title: string;
  message: string;
  entityType?: string;
  entityId?: string;
  link?: string;
}

export async function createAndEmitNotification(
  params: NotifyParams,
): Promise<void> {
  const [notification] = await db
    .insert(notifications)
    .values(params)
    .returning();

  try {
    const io = getIO();
    io.to(`user:${params.userId}`).emit("notification:new", notification);
    // Also emit status-changed event so user pages can refresh
    if (params.type === "order_status_changed" || params.type === "delivery_status_changed" || params.type === "subscription_approved") {
      io.to(`user:${params.userId}`).emit("order:status-changed", { orderId: params.entityId });
    }
  } catch {
    // Socket.IO may not be available (e.g. Vercel serverless)
  }
}

export function broadcastToAdmins(event: string, data: unknown): void {
  try {
    const io = getIO();
    io.to("admins").emit(event, data);
  } catch {
    // Socket.IO may not be available
  }
}
