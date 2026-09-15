import { boolean, integer, pgTable, text, timestamp, varchar } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: integer("id").generatedByDefaultAsIdentity().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  passwordHash: varchar("passwordHash", { length: 255 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: text("role").default("user").notNull(),
  createdAt: timestamp("createdAt", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updatedAt", { withTimezone: true }).defaultNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn", { withTimezone: true }).defaultNow().notNull(),
});

export const categories = pgTable("categories", {
  id: integer("id").generatedByDefaultAsIdentity().primaryKey(),
  name: varchar("name", { length: 120 }).notNull(),
  slug: varchar("slug", { length: 140 }).notNull().unique(),
  imageUrl: varchar("imageUrl", { length: 500 }),
  createdAt: timestamp("createdAt", { withTimezone: true }).defaultNow().notNull(),
});

export const products = pgTable("products", {
  id: integer("id").generatedByDefaultAsIdentity().primaryKey(),
  name: varchar("name", { length: 180 }).notNull(),
  slug: varchar("slug", { length: 220 }).notNull().unique(),
  categoryId: integer("categoryId"),
  categoryName: varchar("categoryName", { length: 120 }).notNull(),
  size: varchar("size", { length: 80 }).notNull(),
  price: integer("price").notNull(),
  oldPrice: integer("oldPrice"),
  imageUrl: varchar("imageUrl", { length: 500 }).notNull(),
  badge: varchar("badge", { length: 80 }),
  description: text("description").notNull(),
  ingredients: text("ingredients"),
  usage: text("usage"),
  stockQuantity: integer("stockQuantity").default(0).notNull(),
  lowStockThreshold: integer("lowStockThreshold").default(5).notNull(),
  rating: integer("rating").default(0).notNull(),
  isFeatured: boolean("isFeatured").default(false).notNull(),
  isBestSeller: boolean("isBestSeller").default(false).notNull(),
  status: text("status").default("active").notNull(),
  createdAt: timestamp("createdAt", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updatedAt", { withTimezone: true }).defaultNow().notNull(),
});

export const customers = pgTable("customers", {
  id: integer("id").generatedByDefaultAsIdentity().primaryKey(),
  name: varchar("name", { length: 160 }).notNull(),
  phone: varchar("phone", { length: 40 }).notNull().unique(),
  email: varchar("email", { length: 320 }),
  totalOrders: integer("totalOrders").default(0).notNull(),
  totalSpent: integer("totalSpent").default(0).notNull(),
  createdAt: timestamp("createdAt", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updatedAt", { withTimezone: true }).defaultNow().notNull(),
});

export const orders = pgTable("orders", {
  id: integer("id").generatedByDefaultAsIdentity().primaryKey(),
  orderNumber: varchar("orderNumber", { length: 40 }).notNull().unique(),
  customerId: integer("customerId"),
  customerName: varchar("customerName", { length: 160 }).notNull(),
  customerPhone: varchar("customerPhone", { length: 40 }).notNull(),
  total: integer("total").notNull(),
  status: text("status").default("new").notNull(),
  whatsappMessage: text("whatsappMessage"),
  createdAt: timestamp("createdAt", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updatedAt", { withTimezone: true }).defaultNow().notNull(),
});

export const orderItems = pgTable("order_items", {
  id: integer("id").generatedByDefaultAsIdentity().primaryKey(),
  orderId: integer("orderId").notNull(),
  productId: integer("productId"),
  productName: varchar("productName", { length: 180 }).notNull(),
  productSize: varchar("productSize", { length: 80 }).notNull(),
  quantity: integer("quantity").notNull(),
  unitPrice: integer("unitPrice").notNull(),
});

export const inventory = pgTable("inventory", {
  id: integer("id").generatedByDefaultAsIdentity().primaryKey(),
  productId: integer("productId").notNull().unique(),
  quantity: integer("quantity").default(0).notNull(),
  lowStockThreshold: integer("lowStockThreshold").default(5).notNull(),
  updatedAt: timestamp("updatedAt", { withTimezone: true }).defaultNow().notNull(),
});

export const offers = pgTable("offers", {
  id: integer("id").generatedByDefaultAsIdentity().primaryKey(),
  name: varchar("name", { length: 160 }).notNull(),
  type: text("type").notNull(),
  description: text("description"),
  active: boolean("active").default(false).notNull(),
  createdAt: timestamp("createdAt", { withTimezone: true }).defaultNow().notNull(),
});

export const settings = pgTable("settings", {
  id: integer("id").generatedByDefaultAsIdentity().primaryKey(),
  settingKey: varchar("settingKey", { length: 120 }).notNull().unique(),
  settingValue: text("settingValue"),
  updatedAt: timestamp("updatedAt", { withTimezone: true }).defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type Product = typeof products.$inferSelect;
export type InsertProduct = typeof products.$inferInsert;
export type Customer = typeof customers.$inferSelect;
export type Order = typeof orders.$inferSelect;
