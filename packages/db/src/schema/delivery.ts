import { pgTable, uuid, text, varchar, pgEnum, timestamp } from "drizzle-orm/pg-core";

export const deliveryPersonStatusEnum = pgEnum("delivery_person_status", ["active", "inactive"]);
export const assignmentStatusEnum = pgEnum("assignment_status", ["pending", "in_transit", "delivered"]);

export const deliveryPersons = pgTable("delivery_persons", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  phone: varchar("phone", { length: 20 }).notNull(),
  provinceId: uuid("province_id").notNull(),
  status: deliveryPersonStatusEnum("status").default("active").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const orderAssignments = pgTable("order_assignments", {
  id: uuid("id").defaultRandom().primaryKey(),
  orderId: uuid("order_id").notNull(),
  deliveryPersonId: uuid("delivery_person_id").notNull(),
  assignedAt: timestamp("assigned_at", { withTimezone: true }).defaultNow().notNull(),
  deliveredAt: timestamp("delivered_at", { withTimezone: true }),
  status: assignmentStatusEnum("status").default("pending").notNull(),
});
