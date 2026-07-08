import { pgTable, uuid, varchar, text, decimal, integer, pgEnum, timestamp } from "drizzle-orm/pg-core";

export const subscriptionPackageStatusEnum = pgEnum("subscription_package_status", ["active", "inactive"]);

export const subscriptionPackages = pgTable("subscription_packages", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  couponCount: integer("coupon_count").notNull(),
  price: decimal("price", { precision: 12, scale: 2 }).notNull(),
  description: text("description"),
  status: subscriptionPackageStatusEnum("status").default("active").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});
