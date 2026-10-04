function env(name: string) { return (process.env[name] ?? "").trim().replace(/^(['"])(.*)\1$/, "$2"); }
const url = env("SUPABASE_URL") || env("VITE_SUPABASE_URL");
const key = env("SUPABASE_SECRET_KEY") || env("SUPABASE_SERVICE_ROLE_KEY");

export default async function handler(req: { method?: string; body?: any }, res: { status: (code: number) => { json: (body: unknown) => void } }) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  if (!url || !key) return res.status(500).json({ error: "Supabase server configuration is missing" });
  const { id, email, name } = req.body ?? {};
  if (!id || !email) return res.status(400).json({ error: "User id and email are required" });
  const response = await fetch(`${url}/rest/v1/users?on_conflict=openId`, {
    method: "POST",
    headers: { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json", Prefer: "resolution=merge-duplicates,return=minimal" },
    body: JSON.stringify({ openId: `supabase:${id}`, email: String(email).toLowerCase(), name: name || null, loginMethod: "supabase", role: String(email).toLowerCase() === "ibrahimahmed@gmail.com" ? "admin" : "user", lastSignedIn: new Date().toISOString() }),
  });
  if (!response.ok) return res.status(500).json({ error: await response.text() });
  return res.status(200).json({ ok: true });
}
