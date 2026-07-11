import { pgTable, uuid, varchar, boolean, timestamp } from "drizzle-orm/pg-core";

export const provinces = pgTable("provinces", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const townships = pgTable("townships", {
  id: uuid("id").defaultRandom().primaryKey(),
  provinceId: uuid("province_id").notNull(),
  name: varchar("name", { length: 100 }).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});
