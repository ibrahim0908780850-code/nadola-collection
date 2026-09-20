import { z } from "zod";
import { SignJWT } from "jose";
import { COOKIE_NAME, LOCAL_AUTH_COOKIE } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { adminProcedure, publicProcedure, router } from "./_core/trpc";
import { ENV } from "./_core/env";
import { storagePut } from "./storage";
import { createOrder, createProduct, deleteProduct, getDashboardStats, getSettings, getUserByEmail, hashPassword, listAdminProducts, listCategories, listCustomers, listOrders, listProducts, registerLocalUser, updateOrderStatus, updateProduct, upsertSetting, verifyPassword } from "./db";

const productInput = z.object({ name: z.string().min(2), slug: z.string().min(2), categoryId: z.number().optional(), categoryName: z.string().min(2), size: z.string().min(1), price: z.number().int().nonnegative(), oldPrice: z.number().int().nonnegative().optional(), imageUrl: z.string().min(1), badge: z.string().optional(), description: z.string().min(2), ingredients: z.string().optional(), usage: z.string().optional(), stockQuantity: z.number().int().nonnegative().default(0), lowStockThreshold: z.number().int().nonnegative().default(5), rating: z.number().int().min(0).max(50).default(0), isFeatured: z.boolean().default(false), isBestSeller: z.boolean().default(false), status: z.enum(["active", "draft", "archived"]).default("active") });
const credentials = z.object({ email: z.string().email(), password: z.string().min(4) });

async function sessionToken(openId: string) {
  return new SignJWT({ type: "local" }).setProtectedHeader({ alg: "HS256" }).setSubject(openId).setIssuedAt().setExpirationTime("7d").sign(new TextEncoder().encode(ENV.cookieSecret));
}
function setLocalCookie(ctx: { res: any }, token: string) { ctx.res.setHeader("Set-Cookie", `${LOCAL_AUTH_COOKIE}=${encodeURIComponent(token)}; Path=/; Max-Age=604800; HttpOnly; SameSite=Lax${ENV.isProduction ? "; Secure" : ""}`); }

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    login: publicProcedure.input(credentials).mutation(async ({ input, ctx }) => {
      const user = await getUserByEmail(input.email);
      if (!user || !verifyPassword(input.password, user.passwordHash)) return { ok: false as const, reason: "NO_ACCOUNT" as const };
      setLocalCookie(ctx, await sessionToken(user.openId));
      return { ok: true as const, user: { id: user.id, name: user.name, email: user.email, role: user.role } };
    }),
    register: publicProcedure.input(z.object({ name: z.string().min(2), email: z.string().email(), password: z.string().min(4) })).mutation(async ({ input, ctx }) => {
      const result = await registerLocalUser(input);
      if (!result.created) return { ok: false as const, reason: "EXISTS" as const };
      setLocalCookie(ctx, await sessionToken(result.user.openId));
      return { ok: true as const, user: { id: result.user.id, name: result.user.name, email: result.user.email, role: result.user.role } };
    }),
    logout: publicProcedure.mutation(({ ctx }) => {
      ctx.res.clearCookie(COOKIE_NAME, { ...getSessionCookieOptions(ctx.req), maxAge: -1 });
      if (typeof ctx.res.setHeader === "function") ctx.res.setHeader("Set-Cookie", `${LOCAL_AUTH_COOKIE}=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax${ENV.isProduction ? "; Secure" : ""}`);
      return { success: true } as const;
    }),
  }),
  catalog: router({ list: publicProcedure.input(z.object({ search: z.string().optional() }).optional()).query(({ input }) => listProducts(input?.search)), categories: publicProcedure.query(() => listCategories()) }),
  orders: router({ create: publicProcedure.input(z.object({ customerName: z.string().min(2), customerPhone: z.string().min(6), total: z.number().int().nonnegative(), whatsappMessage: z.string().optional(), items: z.array(z.object({ productId: z.number().optional(), productName: z.string(), productSize: z.string(), quantity: z.number().int().positive(), unitPrice: z.number().int().nonnegative() })).min(1) })).mutation(({ input }) => createOrder(input)) }),
  admin: router({
    stats: adminProcedure.query(() => getDashboardStats()), orders: adminProcedure.query(() => listOrders()), customers: adminProcedure.input(z.object({ search: z.string().optional() }).optional()).query(({ input }) => listCustomers(input?.search)), settings: adminProcedure.query(() => getSettings()), products: adminProcedure.input(z.object({ search: z.string().optional(), status: z.string().optional() }).optional()).query(({ input }) => listAdminProducts(input?.search, input?.status)),
    createProduct: adminProcedure.input(productInput).mutation(({ input }) => createProduct(input)),
    uploadProductImage: adminProcedure.input(z.object({ fileName: z.string().min(1).max(160), contentType: z.string().regex(/^image\/(jpeg|png|webp|gif)$/), data: z.string().regex(/^data:image\/(jpeg|png|webp|gif);base64,/).max(7_000_000) })).mutation(async ({ input }) => {
      const base64 = input.data.split(",")[1];
      if (!base64) throw new Error("Invalid image data");
      const result = await storagePut(`nadola-products/${Date.now()}-${input.fileName.replace(/[^a-zA-Z0-9._-]/g, "-")}`, Buffer.from(base64, "base64"), input.contentType);
      return { url: result.url };
    }),
    updateProduct: adminProcedure.input(z.object({ id: z.number().int(), data: productInput.partial() })).mutation(({ input }) => updateProduct(input.id, input.data)),
    deleteProduct: adminProcedure.input(z.object({ id: z.number().int() })).mutation(({ input }) => deleteProduct(input.id)),
    updateOrderStatus: adminProcedure.input(z.object({ id: z.number().int(), status: z.enum(["new", "processing", "shipped", "completed", "cancelled"]) })).mutation(({ input }) => updateOrderStatus(input.id, input.status)),
    saveSetting: adminProcedure.input(z.object({ key: z.string().min(2), value: z.string() })).mutation(({ input }) => upsertSetting(input.key, input.value)),
  }),
});
export type AppRouter = typeof appRouter;
