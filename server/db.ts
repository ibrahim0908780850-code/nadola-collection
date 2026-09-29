import { supabaseAdmin } from "./supabase";
import type { InsertUser, User, InsertProduct } from "../drizzle/schema";
import { ENV } from "./_core/env";
import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

export async function getDb() {
  return supabaseAdmin;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const payload = {
    openId: user.openId,
    name: user.name ?? null,
    email: user.email ?? null,
    loginMethod: user.loginMethod ?? "supabase",
    role: user.role ?? (user.openId === ENV.ownerOpenId ? "admin" : "user"),
    lastSignedIn: user.lastSignedIn?.toISOString() ?? new Date().toISOString(),
  };
  const { error } = await supabaseAdmin.from("users").upsert(payload, { onConflict: "openId" });
  if (error) throw error;
}

export async function getUserByOpenId(openId: string): Promise<User | undefined> {
  const { data, error } = await supabaseAdmin.from("users").select("*").eq("openId", openId).limit(1).maybeSingle();
  if (error) throw error;
  return data as User | undefined;
}

export async function getUserByEmail(email: string): Promise<User | undefined> {
  const { data, error } = await supabaseAdmin.from("users").select("*").ilike("email", email.trim().toLowerCase()).limit(1).maybeSingle();
  if (error) throw error;
  return data as User | undefined;
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
  const email = input.email.trim().toLowerCase();
  const existing = await getUserByEmail(email);
  if (existing) return { user: existing, created: false };
  const { data, error } = await supabaseAdmin.from("users").insert({ openId: `local:${email}`, name: input.name.trim(), email, passwordHash: hashPassword(input.password), loginMethod: "password", role: "user" }).select("*").single();
  if (error) throw error;
  return { user: data as User, created: true };
}

export async function listProducts(search?: string) {
  let query = supabaseAdmin.from("products").select("*").eq("status", "active").order("createdAt", { ascending: false });
  if (search?.trim()) query = query.or(`name.ilike.%${search.trim()}%,categoryName.ilike.%${search.trim()}%`);
  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
}

export async function listAdminProducts(search?: string, status?: string) {
  let query = supabaseAdmin.from("products").select("*").order("updatedAt", { ascending: false });
  if (status && status !== "all") query = query.eq("status", status);
  if (search?.trim()) query = query.or(`name.ilike.%${search.trim()}%,categoryName.ilike.%${search.trim()}%`);
  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
}

export async function listCategories() {
  const { data, error } = await supabaseAdmin.from("categories").select("*").order("name");
  if (error) throw error;
  return data ?? [];
}

export async function createProduct(input: InsertProduct) {
  const { data: duplicate } = await supabaseAdmin.from("products").select("id").or(`slug.eq.${input.slug},name.ilike.${input.name}`).limit(1);
  if (duplicate?.length) throw new Error("PRODUCT_ALREADY_EXISTS");
  const { data, error } = await supabaseAdmin.from("products").insert(input).select("id").single();
  if (error) throw error;
  return data?.id;
}

export async function updateProduct(id: number, input: Partial<InsertProduct>) {
  const { error } = await supabaseAdmin.from("products").update({ ...input, updatedAt: new Date().toISOString() }).eq("id", id);
  if (error) throw error;
  return { success: true } as const;
}

export async function deleteProduct(id: number) {
  const { error } = await supabaseAdmin.from("products").update({ status: "archived", updatedAt: new Date().toISOString() }).eq("id", id);
  if (error) throw error;
  return { success: true } as const;
}

export async function createOrder(input: { customerName: string; customerPhone: string; total: number; whatsappMessage?: string; items: Array<{ productId?: number; productName: string; productSize: string; quantity: number; unitPrice: number }> }) {
  const orderNumber = `ND-${Date.now().toString().slice(-8)}`;
  const { data: customer } = await supabaseAdmin.from("customers").select("id,totalOrders,totalSpent").eq("phone", input.customerPhone).limit(1).maybeSingle();
  let customerId = customer?.id;
  if (customerId && customer) {
    await supabaseAdmin.from("customers").update({ name: input.customerName, totalOrders: (customer.totalOrders ?? 0) + 1, totalSpent: (customer.totalSpent ?? 0) + input.total }).eq("id", customerId);
  } else {
    const { data } = await supabaseAdmin.from("customers").insert({ name: input.customerName, phone: input.customerPhone, totalOrders: 1, totalSpent: input.total }).select("id").single();
    customerId = data?.id;
  }
  const { data: order, error } = await supabaseAdmin.from("orders").insert({ orderNumber, customerId, customerName: input.customerName, customerPhone: input.customerPhone, total: input.total, whatsappMessage: input.whatsappMessage }).select("id").single();
  if (error) throw error;
  if (input.items.length && order?.id) await supabaseAdmin.from("orderItems").insert(input.items.map(item => ({ ...item, orderId: order.id })));
  return { orderId: order?.id, orderNumber };
}

export async function getDashboardStats() {
  const [{ count: products }, { count: orders }, { count: customers }, { count: lowStock }, { data: revenueRows }] = await Promise.all([
    supabaseAdmin.from("products").select("id", { count: "exact", head: true }).eq("status", "active"),
    supabaseAdmin.from("orders").select("id", { count: "exact", head: true }),
    supabaseAdmin.from("customers").select("id", { count: "exact", head: true }),
    supabaseAdmin.from("products").select("id", { count: "exact", head: true }).eq("status", "active").lte("stockQuantity", 5),
    supabaseAdmin.from("orders").select("total").neq("status", "cancelled"),
  ]);
  return { products: products ?? 0, orders: orders ?? 0, todayOrders: 0, lowStock: lowStock ?? 0, customers: customers ?? 0, revenue: (revenueRows ?? []).reduce((sum, row) => sum + Number(row.total ?? 0), 0) };
}

export async function listOrders() {
  const { data, error } = await supabaseAdmin.from("orders").select("*").order("createdAt", { ascending: false }).limit(50);
  if (error) throw error;
  return data ?? [];
}

export async function updateOrderStatus(id: number, status: string) {
  const { error } = await supabaseAdmin.from("orders").update({ status, updatedAt: new Date().toISOString() }).eq("id", id);
  if (error) throw error;
  return { success: true } as const;
}

export async function listCustomers(search?: string) {
  let query = supabaseAdmin.from("customers").select("*").order("totalSpent", { ascending: false }).limit(200);
  if (search?.trim()) query = query.or(`name.ilike.%${search.trim()}%,phone.ilike.%${search.trim()}%`);
  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
}

export async function getSettings() {
  const { data, error } = await supabaseAdmin.from("settings").select("*");
  if (error) throw error;
  return data ?? [];
}

export async function upsertSetting(settingKey: string, settingValue: string) {
  const { error } = await supabaseAdmin.from("settings").upsert({ settingKey, settingValue }, { onConflict: "settingKey" });
  if (error) throw error;
}
