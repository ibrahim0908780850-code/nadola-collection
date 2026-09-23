import { sql } from "drizzle-orm";
import { getDb } from "../server/db";

export default async function handler(_req: unknown, res: { status: (code: number) => { json: (body: unknown) => void } }) {
  try {
    const db = await getDb();
    if (!db) {
      res.status(503).json({ ok: false, database: "not_configured" });
      return;
    }
    await db.execute(sql`select 1`);
    res.status(200).json({ ok: true, database: "connected" });
  } catch (error) {
    console.error("[Health] database check failed", error instanceof Error ? error.message : "unknown error");
    res.status(503).json({ ok: false, database: "unavailable" });
  }
}
