import mysql from "mysql2/promise";
import { writeFile } from "node:fs/promises";
const tables = ["users","categories","products","customers","orders","order_items","inventory","offers","settings"];
const connection = await mysql.createConnection(process.env.DATABASE_URL);
const output = {};
for (const table of tables) {
  const [rows] = await connection.query(`SELECT * FROM \`${table}\``);
  output[table] = rows;
}
await connection.end();
await writeFile("/tmp/nadola-source-data.json", JSON.stringify(output, (_key, value) => value instanceof Date ? value.toISOString() : value, 2));
console.log(JSON.stringify(Object.fromEntries(Object.entries(output).map(([key, rows]) => [key, rows.length]))));
