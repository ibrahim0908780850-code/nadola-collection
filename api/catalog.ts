function env(name: string) { return (process.env[name] ?? "").trim().replace(/^(['"])(.*)\1$/, "$2"); }
const url = env("SUPABASE_URL") || env("VITE_SUPABASE_URL");
const key = env("SUPABASE_SECRET_KEY") || env("SUPABASE_SERVICE_ROLE_KEY");
async function read(path: string) { const response = await fetch(`${url}/rest/v1/${path}`, { headers: { apikey: key, Authorization: `Bearer ${key}` } }); if (!response.ok) throw new Error(await response.text()); return response.json(); }
async function admin(req: { headers?: Record<string, string | string[] | undefined> }) { const raw = req.headers?.authorization; const auth = Array.isArray(raw) ? raw[0] : raw; if (!auth) return false; const response = await fetch(`${url}/auth/v1/user`, { headers: { apikey: key, Authorization: auth } }); if (!response.ok) return false; const user = await response.json(); return String(user.email ?? "").toLowerCase() === "ibrahimahmed@gmail.com"; }
export default async function handler(req: { headers?: Record<string, string | string[] | undefined>; query?: Record<string, string | string[] | undefined> }, res: { status: (code: number) => { json: (body: unknown) => void } }) {
  try {
    if (!url || !key) return res.status(500).json({ error: "Supabase server configuration is missing" });
    const isAdmin = await admin(req);
    if (req.query?.admin === "1" && !isAdmin) return res.status(403).json({ error: "Admin access required" });
    const products = await read("products?status=eq.active&order=createdAt.desc");
    if (req.query?.admin === "1") {
      const [allProducts, orders, customers] = await Promise.all([read("products?order=updatedAt.desc"), read("orders?order=createdAt.desc&limit=50"), read("customers?order=totalSpent.desc&limit=200")]);
      return res.status(200).json({ products: allProducts, orders, customers, settings: await read("settings"), stats: { products: allProducts.filter((p: any) => p.status === "active").length, orders: orders.length, todayOrders: 0, lowStock: allProducts.filter((p: any) => p.status === "active" && p.stockQuantity <= p.lowStockThreshold).length, customers: customers.length, revenue: orders.filter((o: any) => o.status !== "cancelled").reduce((s: number, o: any) => s + Number(o.total || 0), 0) } });
    }
    return res.status(200).json({ products });
  } catch (error) { return res.status(500).json({ error: error instanceof Error ? error.message : "Catalog request failed" }); }
}
