import { readFile, writeFile } from "node:fs/promises";
const data = JSON.parse(await readFile("/tmp/nadola-source-data.json", "utf8"));
const q = v => v === null || v === undefined ? "NULL" : typeof v === "boolean" ? (v ? "TRUE" : "FALSE") : typeof v === "number" ? String(v) : `'${String(v).replaceAll("'", "''")}'`;
const cols = { users: ["id","\"openId\"","name","email","\"passwordHash\"","\"loginMethod\"","role","\"createdAt\"","\"updatedAt\"","\"lastSignedIn\""], categories: ["id","name","slug","\"imageUrl\"","\"createdAt\""], products: ["id","name","slug","\"categoryId\"","\"categoryName\"","size","price","\"oldPrice\"","\"imageUrl\"","badge","description","ingredients","usage","\"stockQuantity\"","\"lowStockThreshold\"","rating","\"isFeatured\"","\"isBestSeller\"","status","\"createdAt\"","\"updatedAt\""], inventory: ["id","\"productId\"","quantity","\"lowStockThreshold\"","\"updatedAt\""] };
const sql = [];
for (const table of Object.keys(cols)) {
  const rows = data[table] ?? []; if (!rows.length) continue;
  const keys = cols[table].map(c => c.replaceAll('"',''));
  sql.push(`insert into public.${table} (${cols[table].join(",")}) values\n${rows.map(r => `(${keys.map(k => q(r[k])).join(",")})`).join(",\n")} on conflict (id) do update set ${keys.filter(k => k !== "id").map(k => `\"${k}\" = excluded.\"${k}\"`).join(", ")};`);
  sql.push(`select setval(pg_get_serial_sequence('public.${table}', 'id'), coalesce((select max(id) from public.${table}), 1), true);`);
}
await writeFile("/tmp/nadola-supabase-import.sql", sql.join("\n"));
console.log("generated", sql.length, "statements");
