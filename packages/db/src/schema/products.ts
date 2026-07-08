import { pgTable, uuid, varchar, text, decimal, integer, pgEnum, timestamp } from "drizzle-orm/pg-core";

export const productTypeEnum = pgEnum("product_type", ["retail", "pump", "bottle"]);
export const productStatusEnum = pgEnum("product_status", ["active", "inactive"]);

export const products = pgTable("products", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  price: decimal("price", { precision: 12, scale: 2 }).notNull(),
  type: productTypeEnum("type").notNull(),
  packSize: varchar("pack_size", { length: 50 }),
  imageUrl: text("image_url"),
  status: productStatusEnum("status").default("active").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});
