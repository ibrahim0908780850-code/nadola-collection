import pg from "pg";

const { Client } = pg;

export default async function handler(_req: unknown, res: { status: (code: number) => { json: (body: unknown) => void } }) {
  const rawConnectionString = process.env.SUPABASE_DATABASE_URL;
  if (!rawConnectionString) {
    res.status(503).json({ ok: false, database: "not_configured" });
    return;
  }
  const connectionString = rawConnectionString.replace(/[?&]sslmode=(require|prefer|verify-ca|verify-full)/, "");

  const client = new Client({
    connectionString,
    connectionTimeoutMillis: 12_000,
    ssl: connectionString.includes("supabase") ? { rejectUnauthorized: false } : undefined,
  });

  try {
    await client.connect();
    const result = await client.query("select 1 as ok");
    res.status(200).json({ ok: result.rows[0]?.ok === 1, database: "connected" });
  } catch (error) {
    console.error("[Health] database check failed", error instanceof Error ? error.message : "unknown error");
    res.status(503).json({ ok: false, database: "unavailable" });
  } finally {
    await client.end().catch(() => undefined);
  }
}
