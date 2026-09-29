export default async function handler(_req: unknown, res: { statusCode: number; setHeader: (name: string, value: string) => void; end: (body: string) => void }) {
  try {
    const mod = await import("../server/routers");
    res.statusCode = 200;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ ok: true, router: Boolean(mod.appRouter) }));
  } catch (error) {
    res.statusCode = 500;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ ok: false, detail: error instanceof Error ? error.message : String(error) }));
  }
}
