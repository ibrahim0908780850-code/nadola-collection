function env(name: string) { return (process.env[name] ?? "").trim().replace(/^(['"])(.*)\1$/, "$2"); }
const url = env("SUPABASE_URL") || env("VITE_SUPABASE_URL");
const key = env("SUPABASE_SECRET_KEY") || env("SUPABASE_SERVICE_ROLE_KEY");

async function getAdmin(req: { headers?: Record<string, string | string[] | undefined> }) {
  const rawAuth = req.headers?.authorization;
  const auth = Array.isArray(rawAuth) ? rawAuth[0] : rawAuth;
  if (!auth || !url || !key) return false;
  const response = await fetch(`${url}/auth/v1/user`, { headers: { apikey: key, Authorization: auth } });
  if (!response.ok) return false;
  const user = await response.json();
  return String(user.email ?? "").toLowerCase() === "ibrahimahmed@gmail.com";
}

export default async function handler(req: { method?: string; headers?: Record<string, string | string[] | undefined>; body?: any }, res: { status: (code: number) => { json: (body: unknown) => void } }) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  if (!(await getAdmin(req))) return res.status(403).json({ error: "Admin access required" });
  if (!url || !key) return res.status(500).json({ error: "Supabase server configuration is missing" });
  const body = req.body ?? {};
  if (body.action === "upload") {
    const raw = String(body.data ?? "");
    const match = raw.match(/^data:([^;]+);base64,(.+)$/);
    if (!match) return res.status(400).json({ error: "Invalid image data" });
    const ext = String(body.fileName ?? "image.webp").split(".").pop()?.replace(/[^a-z0-9]/gi, "") || "webp";
    const path = `products/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const upload = await fetch(`${url}/storage/v1/object/product-images/${path}`, { method: "POST", headers: { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": match[1], "x-upsert": "true" }, body: Buffer.from(match[2], "base64") });
    if (!upload.ok) return res.status(500).json({ error: await upload.text() });
    return res.status(200).json({ url: `${url}/storage/v1/object/public/product-images/${path}` });
  }
  if (body.action === "create") {
    const { action: _action, ...product } = body;
    const insert = await fetch(`${url}/rest/v1/products`, { method: "POST", headers: { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json", Prefer: "return=representation" }, body: JSON.stringify(product) });
    if (!insert.ok) return res.status(500).json({ error: await insert.text() });
    return res.status(200).json({ product: await insert.json() });
  }
  if (body.action === "update" || body.action === "delete") {
    const id = Number(body.id);
    if (!id) return res.status(400).json({ error: "Product id is required" });
    const { action: _action, id: _id, ...input } = body;
    if (body.action === "delete") {
      await fetch(`${url}/rest/v1/order_items?productId=eq.${id}`, { method: "DELETE", headers: { apikey: key, Authorization: `Bearer ${key}` } });
      const deleted = await fetch(`${url}/rest/v1/products?id=eq.${id}`, { method: "DELETE", headers: { apikey: key, Authorization: `Bearer ${key}`, Prefer: "return=representation" } });
      if (!deleted.ok) return res.status(500).json({ error: await deleted.text() });
      return res.status(200).json({ deleted: await deleted.json() });
    }
    const update = { ...input, updatedAt: new Date().toISOString() };
    const response = await fetch(`${url}/rest/v1/products?id=eq.${id}`, { method: "PATCH", headers: { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json", Prefer: "return=representation" }, body: JSON.stringify(update) });
    if (!response.ok) return res.status(500).json({ error: await response.text() });
    return res.status(200).json({ products: await response.json() });
  }
  return res.status(400).json({ error: "Unknown action" });
}
