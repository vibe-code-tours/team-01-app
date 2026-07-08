import { pgTable, uuid, varchar, text, timestamp, boolean, pgEnum } from "drizzle-orm/pg-core";

export const userRoleEnum = pgEnum("user_role", ["user", "admin", "delivery"]);
export const userStatusEnum = pgEnum("user_status", ["active", "inactive", "suspended"]);

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  emailVerified: boolean("email_verified").default(false).notNull(),
  passwordHash: text("password_hash").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  phone: varchar("phone", { length: 20 }),
  address: text("address"),
  provinceId: uuid("province_id"),
  townshipId: uuid("township_id"),
  role: userRoleEnum("role").default("user").notNull(),
  status: userStatusEnum("status").default("active").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});
