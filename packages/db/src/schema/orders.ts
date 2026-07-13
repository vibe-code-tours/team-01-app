import { pgTable, uuid, varchar, text, decimal, pgEnum, timestamp } from "drizzle-orm/pg-core";


export const orderTypeEnum = pgEnum("order_type", ["retail", "subscription"]);
export const orderStatusEnum = pgEnum("order_status", [
  "pending",
  "paid",
  "approved",
  "rejected",
  "scheduled",
  "assigned",
  "delivered",
  "cancelled",
]);

export const orders = pgTable("orders", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id").notNull(),
  orderType: orderTypeEnum("order_type").notNull(),
  totalAmount: decimal("total_amount", { precision: 12, scale: 2 }).notNull(),
  status: orderStatusEnum("status").default("pending").notNull(),
  paymentProofUrl: text("payment_proof_url"),
  paymentDetails: text("payment_details"),
  adminNotes: text("admin_notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const orderItems = pgTable("order_items", {
  id: uuid("id").defaultRandom().primaryKey(),
  orderId: uuid("order_id").notNull(),
  productId: uuid("product_id").notNull(),
  quantity: decimal("quantity", { precision: 10, scale: 2 }).notNull(),
  unitPrice: decimal("unit_price", { precision: 12, scale: 2 }).notNull(),
  subtotal: decimal("subtotal", { precision: 12, scale: 2 }).notNull(),
});
