import pg from "pg";
const { Client } = pg;
const base = new URL(process.env.SUPABASE_DATABASE_URL);
const password = decodeURIComponent(base.password);
const candidates = [
  { host: "aws-0-eu-west-1.pooler.supabase.com", user: "postgres.grhtwiiqsddgovvbcvju", port: 5432 },
  { host: "aws-0-eu-west-1.pooler.supabase.com", user: "postgres.grhtwiiqsddgovvbcvju", port: 6543 },
  { host: "aws-1-eu-west-1.pooler.supabase.com", user: "postgres.grhtwiiqsddgovvbcvju", port: 5432 },
  { host: "aws-1-eu-west-1.pooler.supabase.com", user: "postgres.grhtwiiqsddgovvbcvju", port: 6543 },
];
for (const candidate of candidates) {
  const client = new Client({ host: candidate.host, port: candidate.port, user: candidate.user, password, database: "postgres", ssl: { rejectUnauthorized: false }, connectionTimeoutMillis: 5000 });
  try { await client.connect(); const result = await client.query("select 1 as ok"); console.log(`${candidate.host} ${candidate.user}@${candidate.port}: ok=${result.rows[0].ok}`); await client.end(); } catch (error) { console.log(`${candidate.host} ${candidate.user}@${candidate.port}: ${error.code ?? error.message} ${error.message ?? ""}`); try { await client.end(); } catch {} }
}
