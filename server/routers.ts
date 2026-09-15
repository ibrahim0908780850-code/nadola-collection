import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { adminProcedure, publicProcedure, router } from "./_core/trpc";
import { createOrder, createProduct, getDashboardStats, getSettings, listCategories, listOrders, listProducts, upsertSetting } from "./db";

const productInput = z.object({
  name: z.string().min(2), slug: z.string().min(2), categoryId: z.number().optional(), categoryName: z.string().min(2), size: z.string().min(1), price: z.number().int().nonnegative(), oldPrice: z.number().int().nonnegative().optional(), imageUrl: z.string().min(1), badge: z.string().optional(), description: z.string().min(2), ingredients: z.string().optional(), usage: z.string().optional(), stockQuantity: z.number().int().nonnegative().default(0), lowStockThreshold: z.number().int().nonnegative().default(5), rating: z.number().int().min(0).max(50).default(0), isFeatured: z.boolean().default(false), isBestSeller: z.boolean().default(false), status: z.enum(["active", "draft", "archived"]).default("active"),
});

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => { ctx.res.clearCookie(COOKIE_NAME, { ...getSessionCookieOptions(ctx.req), maxAge: -1 }); return { success: true } as const; }),
  }),
  catalog: router({
    list: publicProcedure.input(z.object({ search: z.string().optional() }).optional()).query(({ input }) => listProducts(input?.search)),
    categories: publicProcedure.query(() => listCategories()),
  }),
  orders: router({
    create: publicProcedure.input(z.object({ customerName: z.string().min(2), customerPhone: z.string().min(6), total: z.number().int().nonnegative(), whatsappMessage: z.string().optional(), items: z.array(z.object({ productId: z.number().optional(), productName: z.string(), productSize: z.string(), quantity: z.number().int().positive(), unitPrice: z.number().int().nonnegative() })).min(1) })).mutation(({ input }) => createOrder(input)),
  }),
  admin: router({
    stats: adminProcedure.query(() => getDashboardStats()),
    orders: adminProcedure.query(() => listOrders()),
    settings: adminProcedure.query(() => getSettings()),
    createProduct: adminProcedure.input(productInput).mutation(({ input }) => createProduct(input)),
    saveSetting: adminProcedure.input(z.object({ key: z.string().min(2), value: z.string() })).mutation(({ input }) => upsertSetting(input.key, input.value)),
  }),
});

export type AppRouter = typeof appRouter;
