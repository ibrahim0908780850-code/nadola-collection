import { z } from "zod";
import { systemRouter } from "./_core/systemRouter";
import { adminProcedure, publicProcedure, router } from "./_core/trpc";
import { storagePut } from "./storage";
import { createOrder, createProduct, deleteProduct, getDashboardStats, getSettings, listAdminProducts, listCategories, listCustomers, listOrders, listProducts, updateOrderStatus, updateProduct, upsertSetting } from "./db";

const productInput = z.object({ name: z.string().min(2), slug: z.string().min(2), categoryId: z.number().optional(), categoryName: z.string().min(2), size: z.string().min(1), price: z.number().int().nonnegative(), oldPrice: z.number().int().nonnegative().optional(), imageUrl: z.string().min(1), badge: z.string().optional(), description: z.string().min(2), ingredients: z.string().optional(), usage: z.string().optional(), stockQuantity: z.number().int().nonnegative().default(0), lowStockThreshold: z.number().int().nonnegative().default(5), rating: z.number().int().min(0).max(50).default(0), isFeatured: z.boolean().default(false), isBestSeller: z.boolean().default(false), status: z.enum(["active", "draft", "archived"]).default("active") });
export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(() => ({ success: true } as const)),
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
