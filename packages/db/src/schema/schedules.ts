import { pgTable, uuid, varchar, date, time, integer, boolean, text, timestamp } from "drizzle-orm/pg-core";

export const schedules = pgTable("schedules", {
  id: uuid("id").defaultRandom().primaryKey(),
  provinceId: uuid("province_id").notNull(),
  date: date("date").notNull(),
  timeStart: time("time_start").notNull(),
  timeEnd: time("time_end").notNull(),
  maxOrders: integer("max_orders").notNull(),
  currentOrders: integer("current_orders").default(0).notNull(),
  isProvinceWide: boolean("is_province_wide").default(true).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const scheduleTownships = pgTable("schedule_townships", {
  id: uuid("id").defaultRandom().primaryKey(),
  scheduleId: uuid("schedule_id").notNull(),
  townshipId: uuid("township_id").notNull(),
});

export const orderSchedules = pgTable("order_schedules", {
  id: uuid("id").defaultRandom().primaryKey(),
  orderId: uuid("order_id").notNull(),
  scheduleId: uuid("schedule_id").notNull(),
  townshipId: uuid("township_id").notNull(),
  deliveryAddress: text("delivery_address").notNull(),
  contactPhone: varchar("contact_phone", { length: 20 }).notNull(),
  notes: text("notes"),
});
