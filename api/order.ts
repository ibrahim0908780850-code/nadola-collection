function env(name: string) { return (process.env[name] ?? "").trim().replace(/^(['"])(.*)\1$/, "$2"); }
const url = env("SUPABASE_URL") || env("VITE_SUPABASE_URL");
const key = env("SUPABASE_SECRET_KEY") || env("SUPABASE_SERVICE_ROLE_KEY");
async function request(table: string, init: RequestInit) { const response = await fetch(`${url}/rest/v1/${table}`, { ...init, headers: { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json", ...(init.headers ?? {}) } }); const text = await response.text(); if (!response.ok) throw new Error(text); return text ? JSON.parse(text) : null; }
export default async function handler(req: { method?: string; body?: any }, res: { status: (code: number) => { json: (body: unknown) => void } }) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  try {
    if (!url || !key) throw new Error("Supabase server configuration is missing");
    const input = req.body ?? {};
    const orderNumber = `ND-${Date.now().toString().slice(-8)}`;
    const customerRows = await request("customers?select=id,totalOrders,totalSpent&phone=eq." + encodeURIComponent(input.customerPhone || "عبر واتساب") + "&limit=1", { method: "GET" });
    let customerId = customerRows?.[0]?.id;
    if (customerId) await request(`customers?id=eq.${customerId}`, { method: "PATCH", headers: { Prefer: "return=minimal" }, body: JSON.stringify({ name: input.customerName || "عميل Nadola", totalOrders: Number(customerRows[0].totalOrders || 0) + 1, totalSpent: Number(customerRows[0].totalSpent || 0) + Number(input.total || 0) }) });
    else { const created = await request("customers", { method: "POST", headers: { Prefer: "return=representation" }, body: JSON.stringify({ name: input.customerName || "عميل Nadola", phone: input.customerPhone || "عبر واتساب", totalOrders: 1, totalSpent: Number(input.total || 0) }) }); customerId = created?.[0]?.id; }
    const order = await request("orders", { method: "POST", headers: { Prefer: "return=representation" }, body: JSON.stringify({ orderNumber, customerId, customerName: input.customerName || "عميل Nadola", customerPhone: input.customerPhone || "عبر واتساب", total: Number(input.total || 0), whatsappMessage: input.whatsappMessage || null }) });
    const orderId = order?.[0]?.id;
    if (orderId && Array.isArray(input.items) && input.items.length) await request("order_items", { method: "POST", headers: { Prefer: "return=minimal" }, body: JSON.stringify(input.items.map((item: any) => ({ orderId, productId: item.productId || null, productName: item.productName, productSize: item.productSize, quantity: item.quantity, unitPrice: item.unitPrice }))) });
    return res.status(200).json({ orderId, orderNumber });
  } catch (error) { return res.status(500).json({ error: error instanceof Error ? error.message : "Order save failed" }); }
}
