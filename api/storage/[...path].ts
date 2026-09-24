export default async function handler(req: { url?: string }, res: { status: (code: number) => { send: (body: string) => void }; setHeader: (key: string, value: string) => void; redirect: (code: number, url: string) => void }) {
  const forgeUrl = (process.env.BUILT_IN_FORGE_API_URL ?? "").replace(/\/+$/, "");
  const forgeKey = process.env.BUILT_IN_FORGE_API_KEY;
  const requestPath = new URL(req.url ?? "/", "https://vercel.local").pathname.replace(/^\/api\/storage\//, "");

  if (!forgeUrl || !forgeKey || !requestPath) {
    res.status(503).send("Storage is not configured");
    return;
  }

  try {
    const signedUrl = new URL("v1/storage/presign/get", `${forgeUrl}/`);
    signedUrl.searchParams.set("path", requestPath);
    const response = await fetch(signedUrl, { headers: { Authorization: `Bearer ${forgeKey}` } });
    if (!response.ok) {
      res.status(502).send("Storage backend error");
      return;
    }
    const payload = (await response.json()) as { url?: string };
    if (!payload.url) {
      res.status(502).send("Storage URL unavailable");
      return;
    }
    res.setHeader("Cache-Control", "public, max-age=3600");
    res.redirect(307, payload.url);
  } catch (error) {
    console.error("[Storage] proxy failed", error instanceof Error ? error.message : "unknown error");
    res.status(502).send("Storage proxy error");
  }
}
