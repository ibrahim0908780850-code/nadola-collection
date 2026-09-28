import { describe, expect, it } from "vitest";
import pg from "pg";

const { Client } = pg;

describe("Supabase connection secret", () => {
  it("can execute a lightweight SELECT 1 against the Supabase Session Pooler", async () => {
    const url = process.env.SUPABASE_DATABASE_URL;
    expect(url).toMatch(/aws-1-eu-west-1\.pooler\.supabase\.com:(5432|6543)/);
    const normalizedUrl = url?.replace(/[?&]sslmode=(require|prefer|verify-ca|verify-full)/, "");
    const client = new Client({ connectionString: normalizedUrl, connectionTimeoutMillis: 15_000, ssl: { rejectUnauthorized: false }, options: "-c statement_timeout=10000" });
    await client.connect();
    try {
      const result = await client.query("select 1 as ok");
      expect(result.rows[0]?.ok).toBe(1);
    } finally {
      await client.end();
    }
  }, 20_000);
});
