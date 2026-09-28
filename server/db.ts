import { and, count, desc, eq, or, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import {
  InsertUser, users, products, categories, customers, orders, orderItems, inventory, settings,
  type InsertProduct,
} from "../drizzle/schema";
import { ENV } from "./_core/env";
import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

const { Pool } = pg;
let _db: ReturnType<typeof drizzle> | null = null;
let _pool: pg.Pool | null = null;

export async function getDb() {
  const connectionString = process.env.SUPABASE_DATABASE_URL;
  if (!_db && connectionString) {
    try {
      const normalizedConnectionString = connectionString.replace(/[?&]sslmode=(require|prefer|verify-ca|verify-full)/, "");
      _pool = new Pool({ connectionString: normalizedConnectionString, ssl: normalizedConnectionString.includes("supabase") ? { rejectUnauthorized: false } : undefined, max: 5 });
      _db = drizzle(_pool);
    }
    catch (error) { console.warn("[Database] Failed to connect:", error); _db = null; }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) { console.warn("[Database] Cannot upsert user: database not available"); return; }
  const values: InsertUser = { openId: user.openId };
  const updateSet: Record<string, unknown> = {};
  (['name', 'email', 'loginMethod'] as const).forEach((field) => {
    if (user[field] !== undefined) { values[field] = user[field] ?? null; updateSet[field] = user[field] ?? null; }
  });
  if (user.lastSignedIn !== undefined) { values.lastSignedIn = user.lastSignedIn; updateSet.lastSignedIn = user.lastSignedIn; }
  if (user.role !== undefined) { values.role = user.role; updateSet.role = user.role; }
  else if (user.openId === ENV.ownerOpenId) { values.role = "admin"; updateSet.role = "admin"; }
  values.lastSignedIn ??= new Date();
  if (!Object.keys(updateSet).length) updateSet.lastSignedIn = new Date();
  await db.insert(users).values(values).onConflictDoUpdate({ target: users.openId, set: updateSet });
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb(); if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result[0];
}

export async function getUserByEmail(email: string) {
  const db = await getDb(); if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.email, email.toLowerCase())).limit(1);
  return result[0];
}

export function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  return `${salt}:${scryptSync(password, salt, 64).toString("hex")}`;
}

export function verifyPassword(password: string, stored: string | null) {
  if (!stored) return false;
  const [salt, expected] = stored.split(":");
  if (!salt || !expected) return false;
  const actual = scryptSync(password, salt, 64);
  const expectedBuffer = Buffer.from(expected, "hex");
  return expectedBuffer.length === actual.length && timingSafeEqual(actual, expectedBuffer);
}

export async function registerLocalUser(input: { name: string; email: string; password: string }) {
  const db = await getDb(); if (!db) throw new Error("Database unavailable");
  const email = input.email.trim().toLowerCase();
  const existing = await getUserByEmail(email);
  if (existing) return { user: existing, created: false };
  await db.insert(users).values({ openId: `local:${email}`, name: input.name.trim(), email, passwordHash: hashPassword(input.password), loginMethod: "password", role: "user" });
  const user = await getUserByOpenId(`local:${email}`);
  return { user: user!, created: true };
}

export async function listProducts(search?: string) {
  const db = await getDb(); if (!db) return [];
  const where = search
    ? and(eq(products.status, "active"), or(sql`${products.name} like ${`%${search}%`}`, sql`${products.categoryName} like ${`%${search}%`}`))
    : eq(products.status, "active");
  return db.select().from(products).where(where).orderBy(desc(products.createdAt));
}

export async function listAdminProducts(search?: string, status?: string) {
  const db = await getDb(); if (!db) return [];
  const filters = [];
  if (status && status !== "all") filters.push(eq(products.status, status));
  if (search?.trim()) filters.push(or(sql`${products.name} ilike ${`%${search.trim()}%`}`, sql`${products.categoryName} ilike ${`%${search.trim()}%`}`));
  return db.select().from(products).where(filters.length ? and(...filters) : undefined).orderBy(desc(products.updatedAt));
}

export async function listCategories() {
  const db = await getDb(); if (!db) return [];
  return db.select().from(categories).orderBy(categories.name);
}

export async function createProduct(input: InsertProduct) {
  const db = await getDb(); if (!db) throw new Error("Database unavailable");
  const duplicate = await db.select({ id: products.id }).from(products).where(or(eq(products.slug, input.slug), sql`lower(${products.name}) = lower(${input.name})`)).limit(1);
  if (duplicate.length) throw new Error("PRODUCT_ALREADY_EXISTS");
  const [result] = await db.insert(products).values(input).returning({ id: products.id });
  return result?.id;
}

export async function updateProduct(id: number, input: Partial<InsertProduct>) {
  const db = await getDb(); if (!db) throw new Error("Database unavailable");
  if (input.name || input.slug) {
    const duplicate = await db.select({ id: products.id }).from(products).where(and(sql`${products.id} <> ${id}`, or(input.slug ? eq(products.slug, input.slug) : sql`false`, input.name ? sql`lower(${products.name}) = lower(${input.name})` : sql`false`))).limit(1);
    if (duplicate.length) throw new Error("PRODUCT_ALREADY_EXISTS");
  }
  await db.update(products).set({ ...input, updatedAt: new Date() }).where(eq(products.id, id));
  return { success: true } as const;
}

export async function deleteProduct(id: number) {
  const db = await getDb(); if (!db) throw new Error("Database unavailable");
  await db.update(products).set({ status: "archived", updatedAt: new Date() }).where(eq(products.id, id));
  return { success: true } as const;
}

export async function createOrder(input: {
  customerName: string; customerPhone: string; total: number; whatsappMessage?: string;
  items: Array<{ productId?: number; productName: string; productSize: string; quantity: number; unitPrice: number }>;
}) {
  const db = await getDb(); if (!db) throw new Error("Database unavailable");
  const orderNumber = `ND-${Date.now().toString().slice(-8)}`;
  const existing = await db.select().from(customers).where(eq(customers.phone, input.customerPhone)).limit(1);
  let customerId = existing[0]?.id;
  if (customerId) {
    await db.update(customers).set({ name: input.customerName, totalOrders: sql`${customers.totalOrders} + 1`, totalSpent: sql`${customers.totalSpent} + ${input.total}` }).where(eq(customers.id, customerId));
  } else {
    const [customerResult] = await db.insert(customers).values({ name: input.customerName, phone: input.customerPhone, totalOrders: 1, totalSpent: input.total }).returning({ id: customers.id });
    customerId = customerResult?.id;
  }
  const [orderResult] = await db.insert(orders).values({ orderNumber, customerId, customerName: input.customerName, customerPhone: input.customerPhone, total: input.total, whatsappMessage: input.whatsappMessage }).returning({ id: orders.id });
  const orderId = orderResult?.id;
  if (input.items.length) await db.insert(orderItems).values(input.items.map(item => ({ ...item, orderId })));
  for (const item of input.items) {
    if (item.productId) {
      await db.update(products).set({ stockQuantity: sql`greatest(${products.stockQuantity} - ${item.quantity}, 0)` }).where(eq(products.id, item.productId));
      await db.update(inventory).set({ quantity: sql`greatest(${inventory.quantity} - ${item.quantity}, 0)` }).where(eq(inventory.productId, item.productId));
    }
  }
  return { orderId, orderNumber };
}

export async function getDashboardStats() {
  const db = await getDb(); if (!db) return { products: 0, orders: 0, todayOrders: 0, lowStock: 0, customers: 0, revenue: 0 };
  const [productCount] = await db.select({ value: count() }).from(products).where(eq(products.status, "active"));
  const [orderCount] = await db.select({ value: count() }).from(orders);
  const [customerCount] = await db.select({ value: count() }).from(customers);
  const [lowStock] = await db.select({ value: count() }).from(products).where(and(eq(products.status, "active"), sql`${products.stockQuantity} <= ${products.lowStockThreshold}`));
  const [revenue] = await db.select({ value: sql<number>`coalesce(sum(${orders.total}), 0)` }).from(orders).where(sql`${orders.status} <> 'cancelled'`);
  const [today] = await db.select({ value: count() }).from(orders).where(sql`date(${orders.createdAt}) = current_date`);
  return { products: productCount?.value ?? 0, orders: orderCount?.value ?? 0, todayOrders: today?.value ?? 0, lowStock: lowStock?.value ?? 0, customers: customerCount?.value ?? 0, revenue: Number(revenue?.value ?? 0) };
}

export async function listOrders() {
  const db = await getDb(); if (!db) return [];
  return db.select().from(orders).orderBy(desc(orders.createdAt)).limit(50);
}

export async function updateOrderStatus(id: number, status: string) {
  const db = await getDb(); if (!db) throw new Error("Database unavailable");
  await db.update(orders).set({ status, updatedAt: new Date() }).where(eq(orders.id, id));
  return { success: true } as const;
}

export async function listCustomers(search?: string) {
  const db = await getDb(); if (!db) return [];
  const where = search?.trim()
    ? or(sql`${customers.name} ilike ${`%${search.trim()}%`}`, sql`${customers.phone} ilike ${`%${search.trim()}%`}`)
    : undefined;
  return db.select().from(customers).where(where).orderBy(desc(customers.totalSpent)).limit(200);
}

export async function getSettings() {
  const db = await getDb(); if (!db) return [];
  return db.select().from(settings);
}

export async function upsertSetting(settingKey: string, settingValue: string) {
  const db = await getDb(); if (!db) throw new Error("Database unavailable");
  await db.insert(settings).values({ settingKey, settingValue }).onConflictDoUpdate({ target: settings.settingKey, set: { settingValue } });
}
