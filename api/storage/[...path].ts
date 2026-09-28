export default function handler(req: { url?: string }, res: { status: (code: number) => { send: (body: string) => void }; redirect: (code: number, url: string) => void }) {
  const base = (process.env.VITE_SUPABASE_URL ?? "").replace(/\/+$/, "");
  const requestPath = new URL(req.url ?? "/", "https://vercel.local").pathname.replace(/^\/manus-storage\//, "");
  if (!base || !requestPath) { res.status(503).send("Storage is not configured"); return; }
  res.redirect(307, `${base}/storage/v1/object/public/product-images/${requestPath}`);
}
