const { Client } = require('pg');
require('dotenv').config({ path: '.env' });

const connectionString = process.env.DATABASE_URL;
console.log("Connecting to:", connectionString);

const client = new Client({ connectionString });

async function main() {
  try {
    await client.connect();
    console.log("✅ Database Connected successfully!");
    const res = await client.query('SELECT item_code, item_name, item_type FROM "MST_ITE" LIMIT 5');
    console.log("Result rows:");
    console.table(res.rows);
  } catch (err) {
    console.error("❌ Database Connection Error:");
    console.error(err);
  } finally {
    await client.end();
  }
}

main();
