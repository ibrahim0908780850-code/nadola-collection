import { describe, expect, it } from "vitest";

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const publishableKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

describe("Supabase deployment configuration", () => {
  it("uses a valid Supabase database URL when configured", () => {
    const databaseUrl = process.env.SUPABASE_DATABASE_URL;
    if (!databaseUrl) return;
    expect(databaseUrl).toMatch(/^postgres(ql)?:\/\//);
    expect(databaseUrl).toContain("sslmode");
  });

  it("keeps the public Supabase URL and publishable key aligned when configured", () => {
    if (!supabaseUrl && !publishableKey) return;
    expect(supabaseUrl).toBe("https://grhtwiiqsddgovvbcvju.supabase.co");
    expect(publishableKey).toMatch(/^(sb_publishable_|eyJ)/);
  });

  it("can reach the Supabase REST API with the server secret", async () => {
    if (!supabaseUrl || !serviceRoleKey) return;
    const response = await fetch(`${supabaseUrl}/rest/v1/users?select=id&limit=1`, {
      headers: {
        apikey: serviceRoleKey,
        Authorization: `Bearer ${serviceRoleKey}`,
      },
    });
    expect(response.ok).toBe(true);
  });
});
