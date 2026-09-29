import { describe, expect, it } from "vitest";
import { getDashboardStats, listProducts } from "./db";

describe.skipIf(!process.env.SUPABASE_SERVICE_ROLE_KEY)("Nadola catalog persistence", () => {
  it("returns a safe list shape for the public catalog", async () => {
    const result = await listProducts();
    expect(Array.isArray(result)).toBe(true);
    if (result[0]) {
      expect(result[0]).toHaveProperty("name");
      expect(result[0]).toHaveProperty("price");
      expect(result[0]).toHaveProperty("stockQuantity");
    }
  });

  it("returns dashboard counters with numeric values", async () => {
    const stats = await getDashboardStats();
    expect(stats).toMatchObject({ products: expect.any(Number), orders: expect.any(Number), lowStock: expect.any(Number), customers: expect.any(Number), revenue: expect.any(Number) });
  });
});
